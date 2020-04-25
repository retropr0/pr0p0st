$(function() {

    var drawContent = function(content, width, height) {
        ctx.fillStyle = "#161618";
        ctx.fillRect(0, 0, width, height);
        ctx.font = "bold 20px 'Helvetica Neue', Helvetica, sans-serif";
        //ctx.textBaseline = "bottom";
        ctx.fillStyle = colors["c.schwuchtel"];


        var lines = content.text.split("\n");
        var xPadding = 15;
        var yPadding = 15;

        var x = xPadding;
        var y = yPadding;

        var widestLine = 0;
        var widestImage = 0;
        var lowestImage = 0;

        for (var i = 0; i < lines.length; ++i) {
            x = xPadding;
            var colorPositions = {};
            var fontPositions = [];
            var markerRe = /\${(.*?)}/;

            var lh = 0, // line height
            offset = 0; // offset after line

            if(lines[i].search("f.rießig")>0) {
                lh = 45;
                offset = 10
            } else if(lines[i].search("f.gross")>0) {
                lh = 28;
                offset = 8;
            } else if (lines[i].search("f.normal")>0) {
                lh = 17;
                offset = 5;
            } else if (lines[i].search("f.klein")>0) {
                lh = 13;
                offset = 3;
            } else {
                lh = 20;
                offset = 5;
            }
            y += lh;

            while ((match = markerRe.exec(lines[i])) != null) {
                if (match[1].substring(0,2) === "c.") {
                    colorPositions[match.index] = match[1];
                } else if((match[1].substring(0,2) === "f.")) {
                    fontPositions[match.index] = match[1];
                }
                lines[i] = lines[i].replace(markerRe, "");
            }


            for (var c = 0; c <= lines[i].length; ++c) {
                var chr = lines[i].charAt(c);
                if (c in colorPositions) {
                    ctx.fillStyle = colors[colorPositions[c]];
                }
                if (c in fontPositions) {
                    ctx.font = fonts[fontPositions[c]];
                    if (fontPositions[c] == "f.gross") {
                        lineHeight = 65;
                    } else if (fontPositions[c] == "f.normal") {
                        lineHeight = 25;
                    } else if (fontPositions[c] == "f.klein") {
                        lineHeight = 18;
                    }

                }

                ctx.fillText(chr, x, y);
                x += ctx.measureText(chr).width;
            }

            y += offset;

            if ((x + xPadding) > widestLine) {
                widestLine = x + xPadding;
            }

        }

        y += yPadding; // spacing bottom

        //Images
        for (var f = 0;f < content.images.length; ++f) {
            var img = content.images[f];
            ctx.drawImage(img.img, 0, 0, img.img.width, img.img.height, img.pos.x, img.pos.y, img.size.width, img.size.height);

            if (withAnchors) {
                drawDragAnchor(img.pos.x, img.pos.y);
                drawDragAnchor(img.size.width + img.pos.x, img.pos.y);
                drawDragAnchor(img.size.width + img.pos.x, img.size.height + img.pos.y);
                drawDragAnchor(img.pos.x, img.size.height + img.pos.y);
            }

            widestImage = img.size.width + img.pos.x + xPadding > widestImage ? img.size.width + img.pos.x + xPadding : widestImage;
            lowestImage = img.size.height + img.pos.y + yPadding > lowestImage ? img.size.height + img.pos.y + yPadding : lowestImage;
        }

        //Canvas resize
        var widestElement = widestLine > widestImage ? widestLine : widestImage;
        var highestElement = y > lowestImage ? y : lowestImage;

        if (widestElement > 1052) {
            $('#warn').html("<p>Warnung: pr0-Content ist 1052px breit, dieses Bild ist jedoch "+Math.ceil(widestElement)+"px breit!</p>");
            $('#warn p').attr('unselectable', 'on').css('user-select', 'none').on('selectstart', false);
            $('#warn').css("display", "block");
        } else {
            $('#warn').html('');
            $('#warn').css("display", "none");
        }

        if ((widestElement | 0) != ctx.canvas.width || (highestElement | 0) != ctx.canvas.height) {
            ctx.canvas.width = widestElement;
            ctx.canvas.height = highestElement;
            drawContent(content, ctx.canvas.width, ctx.canvas.height);
        }

    };


    var textArea = $("#imagetext");
    var pr0Canvas = $("#pr0Canvas");
    var bcr = pr0Canvas[0].getBoundingClientRect();
    var colors = {
        "c.fliese": "#6c432b",
        "c.banned": "#444444",
        "c.schwuchtel": "#ffffff",
        "c.orange": "#ee4d2e",
        "c.pr0mium": "#1cb992",
        "c.neu": "#e208ea",
        "c.alt": "#5bb91c",
        "c.mod": "#008fff",
        "c.admin": "#ff9900",
        "c.mittel": "#addc8d",
        "c.alt-mod": "#7fc7ff",        
    };
    var fonts = {"f.klein": "bold 14px 'Helvetica Neue', Helvetica, sans-serif","f.normal": "bold 20px 'Helvetica Neue', Helvetica, sans-serif", "f.groß": "bold 35px 'Helvetica Neue', Helvetica, sans-serif", "f.rießig": "bold 60px 'Helvetica Neue', Helvetica, sans-serif"};
    var content = {"text": textArea.val(), "images": []};
    var draggingImage = -1;
    var draggingResizer = {corner: -1, image: -1};
    var startX = 0;
    var startY = 0;
    var withAnchors = true;
    var keepAspectRatio = true;

    var ctx = pr0Canvas[0].getContext('2d');

    drawContent(content, ctx.canvas.width, ctx.canvas.height);

    textArea.on("keyup", function(key){
        content.text = $(this).val();
        drawContent(content, ctx.canvas.width, ctx.canvas.height);

        if (key.keyCode == 13) {
            refreshCanvasDownloadSizeLabel();
        }
    });

    $("#cb-edit-images").on("change",function() {
        withAnchors = !!$(this).is(":checked");
        drawContent(content, ctx.canvas.width, ctx.canvas.height);
    });
    $("#cb-keep-image-aspect").on("change",function() {
        keepAspectRatio = !!$(this).is(":checked");
    });

    $("#a-refresh-size").on("click", function () {
        refreshCanvasDownloadSizeLabel();
    });

    pr0Canvas.on('dragover', function (e) {
        var event = e.originalEvent;
        e.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        return false;
    });

    pr0Canvas.on('drop', function (e) {
        var event = e.originalEvent;
        e.stopPropagation();
        e.preventDefault();
        bcr = pr0Canvas[0].getBoundingClientRect();
        mouseX = parseInt(event.clientX - bcr.left);
        mouseY = parseInt(event.clientY - bcr.top);

        if (event.dataTransfer.files.length > 0) {
            var file = event.dataTransfer.files[0];
            insertImageOnPosition(file, mouseX, mouseY);
        } else if (event.dataTransfer.getData("Text")) {
            var id = event.dataTransfer.getData("Text");
            var img = new Image();
            img.src = id;
            content.images.push({img: img, pos: {x: mouseX, y: mouseY}, size: {width: 100, height: 100}});
            drawContent(content, ctx.canvas.width, ctx.canvas.height);
        }

        refreshCanvasDownloadSizeLabel();

    });

    function insertImageOnPosition(image, x, y) {
        if (image.type.match('image.*')) {
            var reader = new FileReader();
            reader.onload = function (evt) {
                var img = new Image();
                img.src = evt.target.result;
                img.onload = function() {
                    if (y == -1) {
                        y =  ctx.canvas.height - img.height - 10;
                        if (y < 10) {
                            y =  10;
                        }
                    }

                    content.images.push({img: img, pos: {x: x, y: y}, size: {width: img.width, height: img.height}});
                    drawContent(content, ctx.canvas.width, ctx.canvas.height);
                };
            };
            reader.readAsDataURL(image);
            refreshCanvasDownloadSizeLabel();
        }
    }

    pr0Canvas.mousedown(function(e){handleMouseDown(e);});
    pr0Canvas.mousemove(function(e){handleMouseMove(e);});
    pr0Canvas.mouseup(function(e){handleMouseUp(e);});
    pr0Canvas.mouseout(function(e){handleMouseOut(e);});

    //Partly taken from http://jsfiddle.net/m1erickson/LAS8L/
    function handleMouseDown(e){
        bcr = pr0Canvas[0].getBoundingClientRect();
        startX = parseInt(e.clientX - bcr.left);
        startY = parseInt(e.clientY - bcr.top);

        switch (e.which) {
            case 1:
                $("#cb-edit-images").prop("checked", true);
                withAnchors = true;
                if (e.shiftKey) {
                    var img = hitImage(startX, startY);
                    if (img > -1) {
                        content.images.splice(img, 1);
                    }
                }

                draggingResizer = anchorHitTest(startX, startY);
                if (draggingResizer.image < 0) {
                    draggingImage = hitImage(startX, startY);
                }
                break;
            case 3:
                $("#cb-edit-images").prop("checked", false);
                withAnchors = false;
                drawContent(content, ctx.canvas.width, ctx.canvas.height);
                break;
        }

    }

    function handleMouseUp(e){
        draggingImage = -1;
        draggingResizer = -1;
        drawContent(content, ctx.canvas.width, ctx.canvas.height);
        // refreshCanvasDownloadSizeLabel();
    }

    function handleMouseOut(e){
        draggingImage = -1;
        draggingResizer = -1;
        drawContent(content, ctx.canvas.width, ctx.canvas.height);
    }

    function handleMouseMove(e){

        if (draggingResizer.image > -1) {
            bcr = pr0Canvas[0].getBoundingClientRect();
            mouseX = parseInt(e.clientX - bcr.left);
            mouseY = parseInt(e.clientY - bcr.top);

            var image = content.images[draggingResizer.image];
            var left = image.pos.x;
            var top = image.pos.y;
            var right = image.size.width + left;
            var bottom = image.size.height + top;
            var width = image.img.width;
            var height = image.img.height;
            var aspect = width / height;

            // resize the image
            switch (draggingResizer.corner) {
                case 0:
                    //top-left
                    left = mouseX;
                    width = right - mouseX;
                    top = mouseY;
                    height = bottom - mouseY;
                    break;
                case 1:
                    //top-right
                    top = mouseY;
                    width = mouseX - left;
                    height = bottom - mouseY;
                    break;
                case 2:
                    //bottom-right
                    width = mouseX - left;
                    height = mouseY - top;
                    break;
                case 3:
                    //bottom-left
                    left = mouseX;
                    width = right - mouseX;
                    height = mouseY - top;
                    break;
            }

            // keep aspect ratio fixed
            if (keepAspectRatio) {
                width = height * aspect;
                // keep bottom fixed when dragging one of the top anchors
                if (draggingResizer.corner < 2) {
                    top = bottom - height;
                }
            }

            // prevent size smaller than 25
            if (width >= 25) {
                image.pos.x = left;
                image.size.width = width;
            }
            if (height >= 25) {
                image.pos.y = top;
                image.size.height = height;
            }

            drawContent(content, ctx.canvas.width, ctx.canvas.height);

        } else if (draggingImage > -1) {
            bcr = pr0Canvas[0].getBoundingClientRect();
            mouseX = parseInt(e.clientX - bcr.left);
            mouseY = parseInt(e.clientY - bcr.top);

            // move the image by the amount of the latest drag
            var dx = mouseX - startX;
            var dy = mouseY - startY;
            content.images[draggingImage].pos.x += dx;
            content.images[draggingImage].pos.y += dy;
            // reset the startXY for next time
            startX = mouseX;
            startY = mouseY;

            drawContent(content, ctx.canvas.width, ctx.canvas.height);

        }
    }

    function drawDragAnchor(x, y) {
        ctx.beginPath();
        var styletmp = ctx.fillStyle;
        ctx.fillStyle = colors["c.orange"];
        ctx.arc(x, y, 8, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = styletmp;
    }

    function hitImage(x, y) {
        for (var i = 0;i < content.images.length; ++i) {
            var imageX = content.images[i].pos.x;
            var imageY = content.images[i].pos.y;
            var imageWidth = content.images[i].size.width;
            var imageHeight = content.images[i].size.height;
            if (x > imageX && x < imageX + imageWidth && y > imageY && y < imageY + imageHeight) {
                return i;
            }
        }
        return -1;
    }

    function anchorHitTest(x, y) {
        var dx, dy;

        for (var i = 0;i < content.images.length; ++i) {
            var imageX = content.images[i].pos.x;
            var imageY = content.images[i].pos.y;
            var imageRight = content.images[i].size.width + imageX;
            var imageBottom = content.images[i].size.height + imageY;

            // top-left
            dx = x - imageX;
            dy = y - imageY;
            if (dx * dx + dy * dy <= 64) {
                return ({corner: 0, image: i});
            }
            // top-right
            dx = x - imageRight;
            dy = y - imageY;
            if (dx * dx + dy * dy <= 64) {
                return ({corner: 1, image: i});
            }
            // bottom-right
            dx = x - imageRight;
            dy = y - imageBottom;
            if (dx * dx + dy * dy <= 64) {
                return ({corner: 2, image: i});
            }
            // bottom-left
            dx = x - imageX;
            dy = y - imageBottom;
            if (dx * dx + dy * dy <= 64) {
                return ({corner: 3, image: i});
            }
        }
        return ({corner: -1, image: -1});
    }

    $("#a-download-png").on("click", function () {
        $("#cb-edit-images").prop("checked", false);
        withAnchors = false;
        drawContent(content, ctx.canvas.width, ctx.canvas.height);

        var binaryImage = dataURLtoBlob(pr0Canvas[0].toDataURL("image/png"));
        var imageUrlData = URL.createObjectURL(binaryImage);

        $(this).attr("href", imageUrlData);
        $(this).attr("download", "OC.png");
    });

    function dataURLtoBlob(dataurl) { //credits: http://stackoverflow.com/questions/23150333/html5-javascript-dataurl-to-blob-blob-to-dataurl
        var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], {type:mime});
    }


    function refreshCanvasDownloadSizeLabel() {
        var binaryImage = dataURLtoBlob(pr0Canvas[0].toDataURL("image/png"));
        var size = (binaryImage.size / (1024 * 1024)).toFixed(2);
        var percentage =  100 - Math.round( size / 0.12);
        $("#div-image-info-size-cover").css("width", percentage + "%");
        $("#div-image-info-size-cover span").html(size + " MB");
    }


    // Button Functions

    function addTextAtCursor(text){
        var caretPos = textArea.get(0).selectionStart;
        var textAreaTxt = textArea.val();
        textArea.val(textAreaTxt.substring(0, caretPos) + text + textAreaTxt.substring(caretPos));
        textArea.focus();
        textArea.get(0).setSelectionRange(caretPos + text.length, caretPos + text.length);
        content.text = textArea.val();
        drawContent(content, ctx.canvas.width, ctx.canvas.height);
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
        insertImageOnPosition(file,  10, -1); // -1 = bottom
    });
    $('#flargest').click(function() {
        addTextAtCursor('${f.rießig}');
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
    $('.btn-colored-circle.alt-moderator').on('click', function() {
        addTextAtCursor('${c.alt-mod}');
    });
    $('.btn-colored-circle.admin').on('click', function() {
        addTextAtCursor('${c.admin}');
    });
    $('.btn-colored-circle.mittelaltschwuchtel').on('click', function() {
        addTextAtCursor('${c.mittel}');
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
            content.text = "";
            content.images = [];
            drawContent(content, ctx.canvas.width, ctx.canvas.height);
            refreshCanvasDownloadSizeLabel();
        }
    });
});
