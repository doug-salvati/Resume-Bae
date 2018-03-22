var ppi = 96;
var max_rows = 42;
var max_cols = 5;

class Block {
    constructor(height, width) {
        this.height = height;
        this.width = width;
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

    /* Add a block to the page at the bottom*/
    add_block_vertical(row) {
        if (this.rows.length >= max_rows) {
            alert("No room to add a block");
            return;
        }

        if (this.available_height < this.default_block_height ) {
            var height = this.available_height;
        } else {
            var height = this.default_block_height;
        }

        this.rows.splice(row + 1, 0, [new Block(height, this.width)]);
    }

    /* Add a block to the page at the end of the current road*/
    add_block_horizontal(row) {
        if (this.rows[row].length >= max_cols) {
            alert("No room to add a block");
            return;
        }
        var height = rows[0].height;
        var width = this.max_width / (this.rows[row].length + 1);
        this.rows[row][this.rows[row].length] -= width;
        this.rows[row].append(new Block(height, width));
    }

    /* Remove a block from the page */
    delete_block(row, column) {
        /* Give width to another block */
        if (column > 0) {
            this.rows[row][column -1].width += this.rows[row][column].width;
        } else if (this.rows[row].length > 1) {
            this.rows[row][this.rows[row].length].width += this.rows[row][column].width;
        }

        /* Remove block from array */
        this.rows[row].splice(col, 1);

        /* If the row is empty, delete it */
        this.rows.splice(row, 1);
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
function initialize(){
    var my_resume = new Resume();
    $("#add_vertical").click(function() {
        my_resume.add_block_vertical(my_resume.rows[ROW].length + 1); //ROW is the current row, needs change to element
    })  
    $("#add_horizontal").click(function(){
        my_resume.add_block_horizontal(my_resume.rows[ROW].length); //ROW is the current row, needs change to element
    })
    $("#delete").click(function(){
        my_resume.delete_block(my_resume.rows[ROW].length, my_resume.rows[ROW][COLUMNS]); //ROW is the current row, needs change to element, COLUMNS same
    })
    $("#resize_vertical")/* drag event */ (function(){
        var press; //y coord on mouse press
        var release; //y coord on mouse release
        myResume.resize_vertical(my_resume.rows[ROW].length, (release - press))
    })
    $("#resize_horizontal")/* drag event */ (function(){
        var press; //y coord on mouse press
        var release; //y coord on mouse release
        myResume.resize_horizontal(my_resume.rows[ROW].length, (release - press))
    })
}