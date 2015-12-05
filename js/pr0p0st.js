$(function() {
    var drawContent = function(content, width, height) {
        ctx.fillStyle = "#161618";
        ctx.fillRect(0, 0, width, height);
        ctx.font = "bold 20px Arial";
        ctx.fillStyle = colors["c.white"];


        var lines = content.text.split("\n");
        var xPadding = 30;
        var yPadding = 30;

        var x = xPadding;
        var y = yPadding;

        var widestLine = 0;
        var widestImage = 0;
        var lowestImage = 0;

        for (var i = 0; i < lines.length; ++i) {
            x = 10;
            var lineHeight = ctx.measureText("M").width * 1.5;
            var colorPositions = {};
            var fontPositions = {};
            var markerRe = /\${(.*?)}/;

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
                }
                ctx.fillText(chr, x, y);
                if (lineHeight < ctx.measureText("M").width * 1.5) {
                    lineHeight = ctx.measureText("M").width * 1.5;
                }
                x += ctx.measureText(chr).width;
            }

            y += lineHeight;

            widestLine = ctx.measureText(lines[i]).width + xPadding > widestLine ? ctx.measureText(lines[i]).width + xPadding : widestLine;

        }

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
            $('#warn').html("<p>Warnung: pr0' Content ist 1052px Breit, dieses Bild ist "+Math.ceil(widestElement)+"px breit!</p>");
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
    var colors = {"c.white": "#ffffff", "c.orange": "#ee4d2e"};
    var fonts = {"f.small": "bold 14px Arial", "f.medium": "bold 20px Arial", "f.large": "bold 60px Arial"};
    var content = {"text": textArea.val(), "images": []};
    var draggingImage = -1;
    var draggingResizer = {corner: -1, image: -1};
    var startX = 0;
    var startY = 0;
    var withAnchors = true;

    var ctx = pr0Canvas[0].getContext('2d');

    drawContent(content, ctx.canvas.width, ctx.canvas.height);

    textArea.on("keyup", function(){
        content.text = $(this).val();
        drawContent(content, ctx.canvas.width, ctx.canvas.height);
    });

    $("#cb-edit-images").on("change",function() {
        withAnchors = !!$(this).is(":checked");
        drawContent(content, ctx.canvas.width, ctx.canvas.height);
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
        var file = event.dataTransfer.files[0];

        if (file.type.match('image.*')) {
            var reader = new FileReader();
            reader.onload = function (evt) {
                var img = new Image;
                img.src = evt.target.result;
                content.images.push({img: img, pos: {x: 10, y: 10}, size: {width: img.width, height: img.height}});
                drawContent(content, ctx.canvas.width, ctx.canvas.height);
            };
            reader.readAsDataURL(file);
        }

    });

    pr0Canvas.mousedown(function(e){handleMouseDown(e);});
    pr0Canvas.mousemove(function(e){handleMouseMove(e);});
    pr0Canvas.mouseup(function(e){handleMouseUp(e);});
    pr0Canvas.mouseout(function(e){handleMouseOut(e);});

    //Partly taken from http://jsfiddle.net/m1erickson/LAS8L/
    function handleMouseDown(e){
        bcr = pr0Canvas[0].getBoundingClientRect();
        startX = parseInt(e.clientX - bcr.left);
        startY = parseInt(e.clientY - bcr.top);

        if (e.shiftKey) {
            var img = hitImage(startX, startY);
            if (img > -1) {
                content.images.splice(img);
            }
        }

        draggingResizer = anchorHitTest(startX, startY);
        if (draggingResizer.image < 0) {
            draggingImage = hitImage(startX, startY);
        }

    }

    function handleMouseUp(e){
        draggingImage = -1;
        draggingResizer = -1;
        drawContent(content, ctx.canvas.width, ctx.canvas.height);
    }

    function handleMouseOut(e){
        draggingImage = -1;
        draggingResizer = -1;
//                withAnchors = false;
        drawContent(content, ctx.canvas.width, ctx.canvas.height);
    }

    function handleMouseMove(e){
//                if (!withAnchors) {
//                    withAnchors = true;
//                    drawContent(content, ctx.canvas.width, ctx.canvas.height);
//                }

        if (draggingResizer.image > -1) {
            bcr = pr0Canvas[0].getBoundingClientRect();
            mouseX = parseInt(e.clientX - bcr.left);
            mouseY = parseInt(e.clientY - bcr.top);

            var imageX = content.images[draggingResizer.image].pos.x;
            var imageY = content.images[draggingResizer.image].pos.y;
            var imageWidth = content.images[draggingResizer.image].img.width;
            var imageHeight = content.images[draggingResizer.image].img.height;
            var imageRight = content.images[draggingResizer.image].size.width + imageX;
            var imageBottom = content.images[draggingResizer.image].size.height + imageY;

            // resize the image
            switch (draggingResizer.corner) {
                case 0:
                    //top-left
                    imageX = mouseX;
                    imageWidth = imageRight - mouseX;
                    imageY = mouseY;
                    imageHeight = imageBottom - mouseY;
                    break;
                case 1:
                    //top-right
                    imageY = mouseY;
                    imageWidth = mouseX - imageX;
                    imageHeight = imageBottom - mouseY;
                    break;
                case 2:
                    //bottom-right
                    imageWidth = mouseX - imageX;
                    imageHeight = mouseY - imageY;
                    break;
                case 3:
                    //bottom-left
                    imageX = mouseX;
                    imageWidth = imageRight - mouseX;
                    imageHeight = mouseY - imageY;
                    break;
            }

            if(imageWidth < 25) {imageWidth = 25;}
            if(imageHeight < 25) {imageHeight = 25;}

            content.images[draggingResizer.image].pos.x = imageX;
            content.images[draggingResizer.image].pos.y = imageY;
            content.images[draggingResizer.image].size.width = imageWidth;
            content.images[draggingResizer.image].size.height = imageHeight;

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
            imageRight += dx;
            imageBottom += dy;
            // reset the startXY for next time
            startX = mouseX;
            startY = mouseY;

            drawContent(content, ctx.canvas.width, ctx.canvas.height);

        }
    }

    function drawDragAnchor(x, y) {
        ctx.beginPath();
        var styletmp = ctx.fillStyle;
        ctx.fillStyle = colors.orange;
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
        //TODO: Alter quality/compression for png.
        var quality = 1.0; //parseFloat($("#range-image-quality").val() / 100).toFixed(2);
        $(this).attr("href", pr0Canvas[0].toDataURL("image/png", quality));
        $(this).attr("download", "OC.png");
    });


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

    $('#flarge').click(function() {
        addTextAtCursor('${f.large}');
    });
    $('#fmedium').click(function() {
        addTextAtCursor('${f.medium}');
    });
    $('#fsmall').click(function() {
        addTextAtCursor('${f.small}');
    });
    $('#forange').click(function() {
        addTextAtCursor('${c.orange}');
    });
    $('#fwhite').click(function() {
        addTextAtCursor('${c.white}');
    });
    $('#fclear').click(function() {
        textArea.val('');
        textArea.focus();
    });
});
