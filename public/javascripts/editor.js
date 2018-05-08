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
const drag_options = {revert: revert_handler, zIndex: 999, containment: "#page"};
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
// Class names and structures
var classesdict = {};

class Block {
    constructor(height, width, isLine, classname = "none") {
        this.height = height;
        this.width = width;
        this.contents = (classname === "none") ? "" : classesdict[classname];
        this.isLine = isLine; // denotes whether the block is a line or not
        this.class = classname;
        //this.alignment = 'left';
    }
}

/*This class requires a div#page to work.
    It will create and maintain elements of types
    div.block and span.blockwrapper
    Depends on existence of a global class listing, classdict */
class Resume {
    constructor() { //perhaps add an available width that can be given to last block in row
        this.max_height = 9 * ppi;
        this.max_width = 6.5 * ppi;
        this.default_block_height = this.max_height / 4;
        this.default_line_height = 6; //height for horiz., width for vert. line block
        this.minimum_block_width = ppi;
        this.available_height = this.max_height - this.default_block_height;
        this.rows = [[new Block(this.default_block_height, this.max_width, false)]];
        this.line_style = 'solid';
    }

    save() {
        $('.block').each(function() {
            var richtext = $(this).html();
            var block = my_resume.rows[$(this).data("row")][$(this).data("column")];
            block.contents = richtext;
            if (block.class !== "none") {
                classesdict[block.class] = Resume.generateStructure(richtext, block.class);
            }
        });
    }

    static generateStructure(richtext, classname) {
        richtext = richtext.replace(/\>[^\<]+?\</g, ">" + classname + " <");
        richtext = richtext.replace(/^[^\<]+?\</g, classname + " <");
        richtext = richtext.replace(/\>[^\<]+?$/g, ">" + classname);
        return richtext;
    }

    /* Draw a row */
    drawPage(selection, save = true) {
        // Save current state
        if (save) {
            $('.block').each(function() {
                var richtext = $(this).html();
                var block = my_resume.rows[$(this).data("row")][$(this).data("column")];
                block.contents = richtext;
            });
        }
        $("#page").html("");
        for (var i = 0; i < this.rows.length; ++i) {
            for (var j = 0; j < this.rows[i].length; ++j) {
                if(this.rows[i][j].isLine == false){
                    var style = "";
                    if (i == selection[0] && j == selection[1]) {
                        style += "resize: both;";
                    }
                    if (this.rows[i][j].alignment != 'left') { style += ' text-align: ' + this.rows[i][j].alignment}
                    var block = $('<div class="block" contenteditable="true" style="' + style + '">' + this.rows[i][j].contents + '</div>');
                    block.css("border", "none"); //moved here to deal with line
	        }
                else{
                    var block = $('<div class="line"></div>');
                    block.css("border", "3px " + this.line_style + " black"); //moved here to deal with line 
                }
                block.data("row", i).data("column", j);
                block.mousedown(changeSelection);
                block.focusout(function () {
                    // If NOT hovering over a block (necessarily is the case if you clicked another)
                    if (!$('.block, input').filter(function() { return $(this).is(":hover"); }).length) {
                        // Don't allow you to focus
                        $(this).focus();
                    }
                });
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
        $('.block').mouseenter(function(event) {
            $(this).parent().draggable({disabled: true});
        });
        $('.block').mouseleave(function() {
            $(this).parent().draggable({disabled: false});
        });
        // Store which element is being dragged and where the drag began
        $('.blockwrapper').mousedown(function(event) {
            if (!$(this).draggable( "option", "disabled")) {
                dragstart = event.pageY;
                draggingr = $(this).children().first().data("row");
                draggingc = $(this).children().first().data("column");
            }
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

        this.rows.splice(row, 0, [new Block(height, this.max_width, false, classname)]);
        console.log("adding row at " + row);
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
	if(this.rows[row][column].isLine == false){
        /* Make sure there's more than one */
          if ($('.block').length == 1) {
            alert("You can't delete the last block");
            return;
          }
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
	if(old_location[0] < 0 || old_location[1] < 0 || new_location[0] < 0 || new_location[1] < 0){ //accounts for misread (negative) index values
	return;
}
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
	    this.available_height -= height_change;
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
    $('#slider').slideReveal({
        trigger: $("#trigger"),
        push: false,
        width: '200px'
    });
    // Load a saved resume if logged in
    if (typeof(saved) === 'undefined') {
        my_resume = new Resume();
    } else {
        my_resume = Object.setPrototypeOf(saved, Resume.prototype);
    }
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
        if (!(classeslist.includes(classname))) {
            classeslist.push(classname);
            var new_listing = $("<li>" + classname + "</ul>");
            classesdict[classname] = "";
            new_listing.click(function() {
                var classname = $(this).text();
                if (classname == "No Class") classname = "none";
                var direction = $("input[name=existing_class_row]:checked").val();
                if (direction == "vertical") {
                    my_resume.save();
                    my_resume.add_block_vertical(my_resume.rows.length + 1, classname);
                    my_resume.drawPage(selection);
                } else {
                    my_resume.save();
                    my_resume.add_block_horizontal(selection[0], classname);
                    my_resume.drawPage(selection);
                }
            });
            $("#classes_listing").append(new_listing);
        }
        if (direction == "vertical") {
            my_resume.save();
            my_resume.add_block_vertical(my_resume.rows.length + 1, classname);
            my_resume.drawPage(selection);
        } else {
            my_resume.save();
            my_resume.add_block_horizontal(selection[0], classname);
            my_resume.drawPage(selection);
        }
    });
    // Add an existing class dropdown
    $("#class_dropdown, #existing_class").hover(function(){$("#existing_class").toggle();});
    $("#classes_listing>li").click(function() {
        var classname = $(this).text();
        if (classname == "No Class") classname = "none";
        var direction = $("input[name=existing_class_row]:checked").val();
        if (direction == "vertical") {
            my_resume.add_block_vertical(my_resume.rows.length + 1, classname);
            my_resume.drawPage(selection, true);
        } else {
            my_resume.add_block_horizontal(selection[0], classname);
            my_resume.drawPage(selection, true);
        }
    });

    // Delete
    $("#delete").click(function(){
        my_resume.save();
        my_resume.delete_block(selection[0], selection[1]);
        selection = [0,0];
        my_resume.drawPage(selection, false);
    });

    //bold function
    $("#bold").click(function() {
        document.execCommand('bold');
    });

    //italic function
    $("#italic").click(function() {
        document.execCommand('italic');
    });

        //underline function
    $("#underline").click(function() {
        document.execCommand('underline');
    });

        //strikethrough function
    $("#strikethrough").click(function() {
        document.execCommand('strikeThrough');
    });

        //undo function
    $("#undo").click(function() {
        document.execCommand('undo');
    });

        //redo function
    $("#redo").click(function() {
        document.execCommand('redo');
    });

    // Bullets
    $("#bullet").click(function() {
        document.execCommand('insertUnorderedList');
    });

    // numbered list
    $("#number").click(function() {
        document.execCommand('insertOrderedList');
    });

    // align left
    $("#alignl").click(function() {
        document.execCommand('justifyLeft');
    });

    // align right
    $("#alignr").click(function() {
        document.execCommand('justifyRight');
    });

    // align center
    $("#alignc").click(function() {
        document.execCommand('justifyCenter');
    });

    // align full
    $("#alignf").click(function() {
        document.execCommand('justifyFull');
    });

    // size
    $("#sizeb").click(function() {
        var size = parseInt(document.getElementById('size').value);
        document.execCommand('fontSize', false, size);
        switch(size) {
            case 1:
                break;
            case 2:
                break;
            case 3:
                  var space = document.getElementsByClassName('block');
                  for(var i=0; i<space.length; i++) {
                        space[i].style.lineheight = '50px';
                  }
                break;
            case 4:
                break;
            case 5:
                  var space = document.getElementsByClassName('current');
                  for(var i=0; i<space.length; i++) {
                        space[i].style.lineheight = '50px';
                  }
                break;
            case 6:
                break;
            case 7:
                break;
        }
    });

    // font
    $("#font").click(function() {
        var font = document.getElementById('font').value;
        document.execCommand('fontName', false, font);
    });

    // color
    $("#colorb").click(function() {
        var color = document.getElementById('color').value;
        document.execCommand('forecolor', false, color);
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
        my_resume.add_line_horizontal(my_resume.rows.length + 1);
        my_resume.drawPage(selection);
    });

    //NOT IMPLEMENTED YET
    $("#change_line_style").change(function(){ 
        //my_resume.change_line_style(ELEMENT_IN_DROP_DOWN);
    });

    $("#save_resume").click(function() {
        my_resume.save();
        $.post("/editor/save", { resume: JSON.stringify(my_resume) });
    });

    // Save resume before login submit
    if ($('#signup').length) {
        $('#signup').submit(function () {
            my_resume.save();
            $("input[name=resume]").val(JSON.stringify(my_resume));
        });
    }

}

function changeSelection() {
    var selection_old = selection.slice();
    selection = [$(this).data("row"), $(this).data("column")];
    if(selection_old[0] != selection[0] || selection_old[1] != selection[1]){
        $(".current>.block").css("resize", "none");
        $(".current").removeClass("current");
        $(this).parent().addClass("current");
        $(this).css("resize", "both");
        new_selection = true;
    }
}

// On a drop event, this callback is triggered to adjust the resume
//    object and re-draw
function triggerMove(event, ui) {
    // Save pre-move state
    $('.block').each(function() {
        var richtext = $(this).html();
        var block = my_resume.rows[$(this).data("row")][$(this).data("column")];
        block.contents = richtext;
    });
    var drop_row = $(this).children().first().data("row");
    var drop_col = $(this).children().first().data("column");
    var drag_row = lastdragr; //Will sometimes pull negative number instead of correct one
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
    my_resume.drawPage(selection, false);
}

function getTextareas(my_resume){

      var $textareas = jQuery('.block');

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
