var ppi = 96;
var max_rows = 42;
var max_cols = 5;

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
                if (i == selection[0] && j == selection[1]) {
                    block.addClass("current");
                }
                block.data("row", i).data("column", j);
                block.click(changeSelection);
                block.change(textChanged);
                block.css("height", this.rows[i][j].height);
                block.css("width", this.rows[i][j].width - 8);
                $("#page").append(block);
            }
        }
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
        /* Give width to another block */
        if (column > 0) {
            this.rows[row][column - 1].width += this.rows[row][column].width;
        } else if (this.rows[row].length > 1) {
            this.rows[row][this.rows[row].length - 1].width += this.rows[row][column].width;
        }

        /* Remove block from array */
        this.rows[row].splice(column, 1);

        /* If the row is empty, delete it */
        if (this.rows[row].length == 1) {
            this.rows.splice(row, 1);
        }
    }

    /* Change position of block in the document */
    move() {

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
    $(".block").addClass("current");

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
    $(this).addClass("current");
}

function textChanged() {
    text = $(this).val();
    block = my_resume.rows[$(this).data("row")][$(this).data("column")];
    block.contents = text;
}

$(document).ready(initialize);