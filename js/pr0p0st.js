$(function() {

    var textArea = $("#imagetext");
    var pr0Canvas = new Pr0Canvas("pr0Canvas");

    pr0Canvas.content.text = textArea.val();
    pr0Canvas.drawContent();

    textArea.on("keyup", function(key){
        pr0Canvas.content.text = $(this).val();
        pr0Canvas.drawContent();

        if (key.keyCode === 13) {
            pr0Canvas.refreshCanvasDownloadSizeLabel();
        }
    });

    $("#cb-edit-images").on("change",function() {
        pr0Canvas.imageAnchors = !!$(this).is(":checked");
        pr0Canvas.drawContent();
    });

    $("#cb-keep-image-aspect").on("change",function() {
        pr0Canvas.keepAspectRatio = !!$(this).is(":checked");
    });

    $("#a-refresh-size").on("click", function () {
        pr0Canvas.refreshCanvasDownloadSizeLabel();
    });

    $("#a-download-png").on("click", function () {
        $("#cb-edit-images").prop("checked", false);
        pr0Canvas.imageAnchors = false;
        pr0Canvas.drawContent();

        var binaryImage = pr0Canvas.dataURLtoBlob(pr0Canvas.element.toDataURL("image/png"));
        var imageUrlData = URL.createObjectURL(binaryImage);

        $(this).attr("href", imageUrlData);
        $(this).attr("download", "OC.png");
    });

    // Button Functions

    function addTextAtCursor(text){
        var caretPos = textArea.get(0).selectionStart;
        var textAreaTxt = textArea.val();
        textArea.val(textAreaTxt.substring(0, caretPos) + text + textAreaTxt.substring(caretPos));
        textArea.focus();
        textArea.get(0).setSelectionRange(caretPos + text.length, caretPos + text.length);
        pr0Canvas.content.text = textArea.val();
        pr0Canvas.drawContent();
    }

    $('#btn-image-add').click(function() {
        var elem = document.getElementById("file-input");
        if(elem && document.createEvent) {
            var evt = document.createEvent("MouseEvents");
            evt.initEvent("click", true, false);
            elem.dispatchEvent(evt);
        }
    });

    $('#file-input').on('change', function(e) {
        var file = e.target.files[0];
        pr0Canvas.insertImageAtPosition(file,  10, -1); // -1 = bottom
    });

    $('#flarge').click(function() {
        addTextAtCursor('${f.gross}');
    });
    $('#fmedium').click(function() {
        addTextAtCursor('${f.normal}');
    });
    $('#fsmall').click(function() {
        addTextAtCursor('${f.klein}');
    });
    $('.btn-colored-circle.fliese').on('click', function() {
        addTextAtCursor('${c.fliese}');
    });
    $('.btn-colored-circle.banned').on('click', function() {
        addTextAtCursor('${c.banned}');
    });
    $('.btn-colored-circle.orange').on('click', function() {
        addTextAtCursor('${c.orange}');
    });
    $('.btn-colored-circle.schwuchtel').on('click', function() {
        addTextAtCursor('${c.schwuchtel}');
    });
    $('.btn-colored-circle.neuschwuchtel').on('click', function() {
        addTextAtCursor('${c.neu}');
    });
    $('.btn-colored-circle.pr0mium').on('click', function() {
        addTextAtCursor('${c.pr0mium}');
    });
    $('.btn-colored-circle.altschwuchtel').on('click', function() {
        addTextAtCursor('${c.alt}');
    });
    $('.btn-colored-circle.moderator').on('click', function() {
        addTextAtCursor('${c.mod}');
    });
    $('.btn-colored-circle.admin').on('click', function() {
        addTextAtCursor('${c.admin}');
    });
    $('#closeHelp').on('click', function() {
        $('#modalHelp').fadeOut("fast");
    });
    $('#help').on('click', function() {
        $('#modalHelp').fadeIn("fast");
    });
    $('#fclear').click(function() {
        if (window.confirm("Danach ist alles weg, bist du dir sicher?")) {
            textArea.val('');
            pr0Canvas.content.text = "";
            pr0Canvas.content.images = [];
            pr0Canvas.drawContent();
            pr0Canvas.refreshCanvasDownloadSizeLabel();
        }
    });
});
