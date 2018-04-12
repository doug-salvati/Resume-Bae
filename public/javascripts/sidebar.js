// This file manages all the sidebar tools

$(document).ready(function() {
    // Alignment
    $('#align-l').click(function() {$('.align').prop('disabled', false); $(this).prop('disabled', true); applyAlignment('l');});
    $('#align-r').click(function() {$('.align').prop('disabled', false); $(this).prop('disabled', true); applyAlignment('r');});
    $('#align-c').click(function() {$('.align').prop('disabled', false); $(this).prop('disabled', true); applyAlignment('c');});
    $('#align-j').click(function() {$('.align').prop('disabled', false); $(this).prop('disabled', true); applyAlignment('j');});
    function applyAlignment(type) {
        my_resume.save();
        my_resume.alignment = {'l':'left', 'c':'center', 'r':'right', 'j':'justify'}[type];
        my_resume.drawPage(selection);
    }
});