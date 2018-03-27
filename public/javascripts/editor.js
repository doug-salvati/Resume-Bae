var ppi = 96;
var max_rows = 42;
var max_cols = 5;
function revert_handler(valid) {
    my_resume.drawPage(selection);
    return valid;
}
var drag_options = {revert: revert_handler, revertDuration: 200, zIndex: 999};
var drop_options = {accept: ".blockwrapper", drop: triggerMove};
var draggingr = -1;
var draggingc = -1;
var dragstart = 0;
var lastdragr = -1;

class Block {
    constructor(height, width) {
        this.height = height;
        this.width = width;
        this.contents = "";
    }
}

class Resume {
    constructor() {
        this.max_height = 9 * ppi;
        this.max_width = 6.5 * ppi;
        this.default_block_height = this.max_height / 4;
        this.minimum_block_width = ppi;
        this.available_height = this.max_height - this.default_block_height;
        this.rows = [[new Block(this.default_block_height, this.max_width)]];
    }

    /* Draw a row */
    drawPage(selection) {
        $("#page").html("");
        for (var i = 0; i < this.rows.length; ++i) {
            for (var j = 0; j < this.rows[i].length; ++j) {
                var block = $('<textarea class="block">' + this.rows[i][j].contents + '</textarea>');
                block.data("row", i).data("column", j);
                block.mousedown(changeSelection);
                block.change(textChanged);
                block.css("height", this.rows[i][j].height - 10);
                block.css("width", this.rows[i][j].width - 18);
                $("#page").append(block);
                block.wrap('<span class="blockwrapper"></span>');
                if (i == selection[0] && j == selection[1]) {
                    block.parent().addClass("current");
                }
            }
        }
        $('.blockwrapper').draggable(drag_options);
        $('.blockwrapper').mousedown(function(event) {
            dragstart = event.pageY;
            draggingr = $(this).children().first().data("row");
            draggingc = $(this).children().first().data("column");
        });
        var max = this.max_width;
        $('.blockwrapper').mousemove(function(event) {
            var row = $(this).children().first().data("row");
            var col = $(this).children().first().data("column");
            if (row == draggingr && col == draggingc) {
                var delta = event.pageY - dragstart;
                if (draggingr >= 0 && Math.abs(delta) > 25) {
                    var row_before = $('.blockwrapper').filter(function() {
                        return ($(this).children().first().data("row") == draggingr) &&
                               ($(this).children().first().data("column") < draggingc);
                    });
                    var row_after = $('.blockwrapper').filter(function() {
                        return ($(this).children().first().data("row") == draggingr) &&
                               ($(this).children().first().data("column") > draggingc);
                    });
                    $(this).prepend(row_before).children().css("border", "none");
                    $(this).append(row_after).children().css("border", "none");
                }
            }
        });
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

        this.rows.splice(row + 1, 0, [new Block(height, this.max_width)]);
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
        this.rows[row].push(new Block(height, width));
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
        console.log(old_location);
        console.log(new_location);
        var missing_width = this.rows[old_location[0]][old_location[1]].width;

        let tmp;
        if (old_location[0] == new_location[0]) {
            tmp = this.rows[old_location[0]][old_location[1]];
            this.rows[old_location[0]][old_location[1]] = this.rows[new_location[0]][new_location[1]];
            this.rows[new_location[0]][new_location[1]] = tmp;
        } else {
            tmp = this.rows[old_location[0]];
            this.rows[old_location[0]] = this.rows[new_location[0]];
            this.rows[new_location[0]] = tmp;
        }
    }

    /* Resize a block, affecting the blocks around it */
    resize_vertical(row, height_change) {
        
        if(height_change > this.available_height){
            alert("Not enough leg room to stretch block");
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
            return;
        } else {
            this.rows[row][column+1].width -= width_change;
            this.rows[row][column].width += width_change;
        }
    }
}
/* Init the resume element and the event handlers for the buttons */
function initialize() {
    my_resume = new Resume();
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
        myResume.resize_vertical(my_resume.rows[ROW].length, (release - press))
    })
    $("#resize_horizontal")/* drag event / (function(){
        var press; //y coord on mouse press
        var release; //y coord on mouse release
        myResume.resize_horizontal(my_resume.rows[ROW].length, (release - press))
    })*/
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