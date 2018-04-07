// Some constants and variables needed globally
const ppi = 96;
const max_rows = 42;
const max_cols = 5;
        //var toggle = 0;
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
//flag for when new selected block is chosen
var new_selection = false;

class Block {
    constructor(height, width, isLine, classname = "none") {
        this.height = height;
        this.width = width;
        this.contents = "";
        this.isLine = isLine; // denotes whether the block is a line or not
        this.class = classname;
    }
}

class Resume {
    constructor() { //perhaps add an available width that can be given to last block in row
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
	getTextareas(this);
    }

    /* Add a block to the page at the bottom*/
    add_block_vertical(row, classname = "none") {
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

        this.rows.splice(row + 1, 0, [new Block(height, this.max_width, false, classname)]);
	getTextareas(this);
    }

    /* Add a block to the page at the end of the current road*/
    add_block_horizontal(row, classname = "none") {
        if (this.rows[row].length >= max_cols) {
            alert("No room to add a block");
            return;
        }
        var height = Math.floor(this.rows[row][0].height);
        var width = Math.floor(this.rows[row][this.rows[row].length - 1].width / 2); /*this is shaving off width*/
        this.rows[row][this.rows[row].length - 1].width -= width;
        this.rows[row].push(new Block(height, width, false, classname));
	getTextareas(this);
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
	this.max_height += height_change;
        this.drawPage(selection);
        }
    }

    resize_horizontal(row, column, width_change) {
	//case: only block in row
        if(this.rows[row].length == 1){
            this.rows[row][0].width = this.max_width;
            this.drawPage(selection);
            return;
	}
	//case: last block in row
	if(this.rows[row].length == column+1){
            var cur_width = 0;
	    for(var i=0; i<column; i++){
                cur_width += this.rows[row][i].width;
            }
	    this.rows[row][column].width = this.max_width - cur_width;
	    this.drawPage(selection);
            return;
	}

	//case: width change (+) too large
        if(width_change > this.rows[row][(column+1)].width - this.minimum_block_width) {
            alert("horizontal resize cannot be larger than next block");
	            //the way it is currently written, will give error but not stop resize
            this.drawPage(selection);
            return;
        } 
        //case: width change (-) too large
        else if(this.rows[row][column].width + width_change <= 0){
            this.drawPage(selection);
            return;
        }
        //case: can be resized
        else {
            this.rows[row][(column+1)].width -= width_change;
            this.rows[row][column].width += width_change;
            this.drawPage(selection);
        }
    }

    change_line_style(new_style){
      this.line_style = new_style
    }

    add_line_horizontal(row){ //adds a new horizontal line in vertical block
      if (this.available_height <= 0 || this.available_height < this.default_line_height) {
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
        var width = this.default_line_height;
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
    var classeslist = ["", "none"];

    selection = [0,0] /* Row, column */
    my_resume.drawPage(selection);
    $(".blockwrapper").addClass("current");

    // Add a blank class dialog
    $("#add_blank").click(function(){$("#newclass").toggle();});
    $("#newclass_close").click(function(){$("#newclass").hide();});
    $("#newclass").draggable();
    $("#newclass_create").click(function() {
        $("#newclass").hide();
        var direction = $("input[name=newclass_row]:checked").val();
        var classname = $("#newclass_name").val();
        if (direction == "vertical") {
            my_resume.add_block_vertical(my_resume.rows[selection[0]].length + 1, classname);
            my_resume.drawPage(selection);
        } else {
            my_resume.add_block_horizontal(selection[0], classname);
            my_resume.drawPage(selection);
        }
        if (!(classeslist.includes(classname))) {
            classeslist.push(classname);
            $("#classes_listing").append("<li>" + classname + "</ul>");
        }
    });
    // Add an existing class dropdown
    $("#class_dropdown, #existing_class").hover(function(){$("#existing_class").toggle();});
    $("#classes_listing>li").click(function() {
        var classname = $(this).text();
        if (classname == "No Class") class_choice = "none";
        var direction = $("input[name=existing_class_row]:checked").val();
        if (direction == "vertical") {
            my_resume.add_block_vertical(my_resume.rows[selection[0]].length + 1, classname);
            my_resume.drawPage(selection);
        } else {
            my_resume.add_block_horizontal(selection[0], classname);
            my_resume.drawPage(selection);
        }
    });

    // Delete
    $("#delete").click(function(){
        my_resume.delete_block(selection[0], selection[1]);
        selection = [0,0];
        my_resume.drawPage(selection);
    });

    // Bullets
    $("#bullets").click(function() {


        //if(toggle == 0) {
        
            var text = my_resume.rows[selection[0]][selection[1]].contents;
            my_resume.rows[selection[0]][selection[1]].contents = text.replace(/^/g, "\u2022").replace(/\n/g,"\n\u2022");
            my_resume.drawPage(selection);

            var linestart = function(text, bull) {
            var line_length = text.split("\n");
            var i = line_length.length-1;
            line_length[i] = line_length[i]+'\n'+bull;
            return line_length.join("\n");
            };

            $('textarea').on('keydown', function(e) {
            var t = $(this);
            if(e.which == 13) {
            t.val(linestart(t.val(), '\u2022'));
            return false;
            }  
            //toggle = 1;
        //} else {
            //toggle = 0;
        //}
        });
    });

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

    $("#add_line_vertical").click(function() {
        my_resume.add_line_vertical(selection[0]);
        my_resume.drawPage(selection);
    });  
    $("#add_line_horizontal").click(function(){
        my_resume.add_line_horizontal(my_resume.rows[selection[0]].length + 1);
        my_resume.drawPage(selection);
    });

    //NOT IMPLEMENTED YET
    $("#change_line_style").change(function(){ 
        //my_resume.change_line_style(ELEMENT_IN_DROP_DOWN);
    });

}

function changeSelection() {
    var selection_old = selection.slice();
    selection = [$(this).data("row"), $(this).data("column")];
    if(selection_old[0] != selection[0] || selection_old[1] != selection[1]){
        $(".current").removeClass("current");
        $(this).parent().addClass("current");
        new_selection = true;
    }
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

function getTextareas(my_resume){

      var $textareas = jQuery('textarea');

      $textareas.each(function(){
        $(this).data('x', $(this).outerWidth());
        $(this).data('y', $(this).outerHeight());
      });

      $textareas.mouseup(function(){
        var $this = jQuery(this);
        var changeX, changeY;

if(new_selection == true){
	$this.data('x', $this.outerWidth());
	$this.data('y', $this.outerHeight());
	new_selection = false;
	return;
}

        if($this.outerWidth() != $this.data('x') || $this.outerHeight() != $this.data('y')){
          changeX = $this.outerWidth() - $this.data('x');
          changeY = $this.outerHeight() - $this.data('y');

          my_resume.resize_vertical(selection[0], changeY);
          my_resume.resize_horizontal(selection[0], selection[1], changeX);
          $this.data('x', $this.outerWidth());
          $this.data('y', $this.outerHeight());
        }
      });
}

$(document).ready(initialize);
