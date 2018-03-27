// Some constants and variables needed globally
const ppi = 96;
const max_rows = 42;
const max_cols = 5;
// When a drag has reverted, we need to redraw to undo the
//    drag styling that was applied
function revert_handler(valid) {
    my_resume.drawPage(selection); // my_resume defined on page initialization
    return valid;
}
// Settings for jQuery drag and drop
const drag_options = {revert: revert_handler, zIndex: 999};
const drop_options = {accept: ".blockwrapper", drop: triggerMove};
// Which block is currently being dragged?
var draggingr = -1;
var draggingc = -1;
// Stores Y-point of drag beginning to calculate change in position
//    while moving
var dragstart = 0;
// Save the last row that was dragged for later use
var lastdragr = -1;

class Block {
    constructor(height, width, isLine) {
        this.height = height;
        this.width = width;
        this.contents = "";
	this.isLine = isLine; // denotes whether the block is a line or not
    }
}

class Resume {
    constructor() {
        this.max_height = 9 * ppi;
        this.max_width = 6.5 * ppi;
        this.default_block_height = this.max_height / 4;
        this.default_line_height = 6; //height for horiz., width for vert. line block
        this.minimum_block_width = ppi;
        this.available_height = this.max_height - this.default_block_height;
        this.rows = [[new Block(this.default_block_height, this.max_width, false)]];
	this.selected_block = [0, 0]; //Currently selected block (X, Y)
	this.line_style = 'solid';
    }

    /* Draw a row */
    drawPage(selection) {
        $("#page").html("");
        for (var i = 0; i < this.rows.length; ++i) {
            for (var j = 0; j < this.rows[i].length; ++j) {
                if(this.rows[i][j].isLine == false){
                    var block = $('<textarea class="block">' + this.rows[i][j].contents + '</textarea>');
                    block.css("border", "none"); //moved here to deal with line
	        }
                else{
                    var block = $('<textarea class="line"></textarea>');
                    block.css("border", "3px " + this.line_style + " black"); //moved here to deal with line 
                }
                block.data("row", i).data("column", j);
                block.mousedown(changeSelection);
                block.change(textChanged);
                block.css("height", this.rows[i][j].height - 10);
                block.css("width", this.rows[i][j].width - 18);
                $("#page").append(block);
                // Wrap it to enable resizing and moving
                block.wrap('<span class="blockwrapper"></span>');
                if (i == selection[0] && j == selection[1]) {
                  block.parent().addClass("current");
                }
            }
        }
        // These handlers track the motion of a dragged block
        // If a block is dragged at least halfway out of its row,
        //    the whole row joins it to swap rows 
        $('.blockwrapper').draggable(drag_options);  // Makes element click-and-drag
        // Store which element is being dragged and where the drag began
        $('.blockwrapper').mousedown(function(event) {
            dragstart = event.pageY;
            draggingr = $(this).children().first().data("row");
            draggingc = $(this).children().first().data("column");
        });
        // Some values we need in the mousemove handler
        var max = this.max_width;
        var half_height = this.rows[selection[0]][selection[1]].height / 2;
        // Movement tracking
        $('.blockwrapper').mousemove(function(event) {
            // Get row and column
            var row = $(this).children().first().data("row");
            var col = $(this).children().first().data("column");
            // Make sure this is the handler for the currently dragged block
            if (row == draggingr && col == draggingc) {
                // Check if block has been dragged vertically
                var delta = event.pageY - dragstart;
                if (draggingr >= 0 && Math.abs(delta) > half_height) {
                    // Attach the rest of the row to the current dragged element
                    //    for visual clarity since user is trying to swap rows
                    var cols_before = $('.blockwrapper').filter(function() {
                        return ($(this).children().first().data("row") == draggingr) &&
                               ($(this).children().first().data("column") < draggingc);
                    });
                    var cols_after = $('.blockwrapper').filter(function() {
                        return ($(this).children().first().data("row") == draggingr) &&
                               ($(this).children().first().data("column") > draggingc);
                    });
                    $(this).prepend(cols_before).children().css("border", "none");
                    $(this).append(cols_after).children().css("border", "none");
                }
            }
        });
        // Reset dragging info when the action is completed
        $('.blockwrapper').mouseup(function() {lastdragr = draggingr; draggingr = -1;});
        $('.blockwrapper').droppable(drop_options);
    }

    /* Add a block to the page at the bottom*/
    add_block_vertical(row) {
        if (this.available_height <= 0) {
            alert("No room to add a block");
            return;
        }

        if (this.available_height < this.default_block_height ) {
            var height = this.available_height;
        } else {
            var height = this.default_block_height;
        }

        this.available_height -= height;

        this.rows.splice(row + 1, 0, [new Block(height, this.max_width, false)]);
    }

    /* Add a block to the page at the end of the current road*/
    add_block_horizontal(row) {
        if (this.rows[row].length >= max_cols) {
            alert("No room to add a block");
            return;
        }
        var height = Math.floor(this.rows[row][0].height);
        var width = Math.floor(this.rows[row][this.rows[row].length - 1].width / 2);
        this.rows[row][this.rows[row].length - 1].width -= width;
        this.rows[row].push(new Block(height, width, false));
    }

    /* Remove a block from the page */
    delete_block(row, column) {
        /* Make sure there's more than one */
        if ($('.block').length == 1) {
            alert("You can't delete the last block");
            return;
        }

        /* Give width to another block */
        if (column > 0) {
            this.rows[row][column - 1].width += this.rows[row][column].width;
        } else if (this.rows[row].length > 1) {
            this.rows[row][this.rows[row].length - 1].width += this.rows[row][column].width;
        }

        /* Remove block from array */
        var deleted_height = this.rows[row][column].height;
        this.rows[row].splice(column, 1);

        /* If the row is empty, delete it */
        if (this.rows[row].length == 0) {
            this.available_height += deleted_height;
            this.rows.splice(row, 1);
        }
    }

    /* Change position of block in the document */
    move(old_location, new_location) {
        let tmp;
        // Move within a row
        if (old_location[0] == new_location[0]) {
            // Swap their indices
            tmp = this.rows[old_location[0]][old_location[1]];
            this.rows[old_location[0]][old_location[1]] = this.rows[new_location[0]][new_location[1]];
            this.rows[new_location[0]][new_location[1]] = tmp;
        // Move across rows
        } else {
            // Swap the entire rows
            tmp = this.rows[old_location[0]];
            this.rows[old_location[0]] = this.rows[new_location[0]];
            this.rows[new_location[0]] = tmp;
        }
    }

    /* Resize a block, affecting the blocks around it */
    resize_vertical(row, height_change) {
        
        if(height_change > this.available_height){
            alert("Not enough leg room to stretch block"); 
	    //the way it is currently written, will give error but not stop resize
	    return;
        }else{
            for(var i = 0; i < this.rows[row].length; i++) {
                this.rows[row][i].height += height_change;
            }
        }
    }

    resize_horizontal(row, column, width_change) {

        if(this.rows[row].length == column + 1)
            return;
        if(width_change > this.rows[row][column+1].width - minimum_block_width) {
            alert("horizontal resize cannot be larger than next block");
	    //the way it is currently written, will give error but not stop resize
            return;
        } else {
            this.rows[row][column+1].width -= width_change;
            this.rows[row][column].width += width_change;
        }
    }

    change_line_style(new_style){
      this.line_style = new_style
    }

    add_line_horizontal(row){ //adds a new horizontal line in vertical block
      if (this.available_height <= 0 || this.available_height < this.default_block_height) {
        alert("No room to add a line");
        return;
      }

      var height = this.default_line_height;

      this.available_height -= height;

      this.rows.splice(row + 1, 0, [new Block(height, this.max_width, true)]);

    }

    add_line_vertical(row) { //adds a new vertical line in a horizontal block
        if (this.rows[row].length >= max_cols) {
            alert("No room to add a block");
            return;
        }
        var height = Math.floor(this.rows[row][0].height);
        var width = default_line_height;
        this.rows[row][this.rows[row].length - 1].width -= width;
        this.rows[row].push(new Block(height, width, true));
    }

    change_line_style(new_style){
      this.line_style = new_style;
    }

}
/* Init the resume element and the event handlers for the buttons */
function initialize() {
    my_resume = new Resume();
    var isDragging = false; //flag for whether or not the mouse is being dragged

    selection = [0,0] /* Row, column */
    my_resume.drawPage(selection);
    $(".blockwrapper").addClass("current");

    $("#add_vertical").click(function() {
        my_resume.add_block_vertical(my_resume.rows[selection[0]].length + 1);
        my_resume.drawPage(selection);
    });  
    $("#add_horizontal").click(function(){
        my_resume.add_block_horizontal(selection[0]);
        my_resume.drawPage(selection);
    });
    $("#delete").click(function(){
        my_resume.delete_block(selection[0], selection[1]);
        selection = [0,0];
        my_resume.drawPage(selection);
    });

    /*$("#resize_vertical")/* drag event / (function(){
        var press; //y coord on mouse press
        var release; //y coord on mouse release
        myResume.resize_vertical($(this).data("row"), (release - press))
    })
    $("#resize_horizontal")/* drag event / (function(){
        var press; //y coord on mouse press
        var release; //y coord on mouse release
        myResume.resize_horizontal($(this).data("row"), (release - press))
    })*/

    $("a").mousedown(function(){
	isDragging = false;
    })
    .mousemove(function(){
	isDragging = true;
    })
    .mouseup(function(){
	var drag = isDragging;
	isDragging = false;
    });

    $("#resize").ready(function(){
      var $textareas = jQuery('textarea');

      $textareas.data('x', $textareas.outerWidth());
      $textareas.data('y', $textareas.outerHeight());

      $textareas.mouseup(function(){
        var $this = jQuery(this);
        var changeX, changeY;

        if($this.outerWidth() != $this.data('x') && $this.outerHeight() != $this.data('y')){
          changeX = $this.data('x') - $this.outerWidth();
          changeY = $this.data('x') - $this.outerHeight();

          myResume.resize_horizontal(selection[0], selection[1], changeX);
          myResume.resize_vertical(selection[0], changeY);
          $this.data('x', $this.outerWidth());
          $this.data('y', $this.outerHeight());			
        }
        else if($this.outerWidth() != $this.data('x')){
          changeX = $this.data('x') - $this.outerWidth(); //May need to be swapped
          myResume.resize_horizontal(selection[0], selection[1], changeX);
          $this.data('x', $this.outerWidth());
        }
        else if($this.outerHeight() != $this.data('y')){
          changeY = $this.data('x') - $this.outerHeight(); //may need to be swapped
          myResume.resize_vertical(selection[0], changeY);
          $this.data('y', $this.outerHeight());
        }
      });
    });

    $("#add_line_vertical").click(function() {
        my_resume.add_line_vertical(selection[0]);
        my_resume.drawPage(selection);
    });  
    $("#add_line_horizontal").click(function(){
        my_resume.add_line_horizontal(my_resume.rows[selection[0]].length + 1);
        my_resume.drawPage(selection);
    });

    $("#change_line_style").change(function(){
        //my_resume.change_line_style(ELEMENT_IN_DROP_DOWN);
    });

}

function changeSelection() {
    selection = [$(this).data("row"), $(this).data("column")];
    $(".current").removeClass("current");
    $(this).parent().addClass("current");
}

function textChanged() {
    text = $(this).val();
    block = my_resume.rows[$(this).data("row")][$(this).data("column")];
    block.contents = text;
}

// On a drop event, this callback is triggered to adjust the resume
//    object and re-draw
function triggerMove(event, ui) {
    var drop_row = $(this).children().first().data("row");
    var drop_col = $(this).children().first().data("column");
    var drag_row = lastdragr;
    var drag_col = draggingc;
    var drop = [drop_row, drop_col];
    var drag = [drag_row, drag_col];
    my_resume.move(drag, drop);
    if (drop_row == drag_row) {
        selection[1] = drop[1];
    }
    else if (selection[0] == drop[0]) {
        selection[0] = drag[0];
    } else {
        selection[0] = drop[0];
    }
    my_resume.drawPage(selection);
}

$(document).ready(initialize);
