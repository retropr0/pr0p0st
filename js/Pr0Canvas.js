function Pr0Canvas(id) {
    this.selector = $("#" + id);
    this.element = this.selector[0];
    this.context = this.element.getContext('2d');
    this.content = {"text": "", "images": []};
    this.draggingImage = -1;
    this.draggingResizer = {corner: -1, image: -1};
    this.imageAnchors = true;
    this.keepAspectRatio = true;
    this.startX = 0;
    this.startY = 0;
    
    this.init();
    this.addEventHandlers();
}

Pr0Canvas.prototype.init = function() {

};

Pr0Canvas.prototype.addEventHandlers = function() {
    this.selector.on("dragover", this.dragOver.bind(this));
    this.selector.on("drop", this.drop.bind(this));
    this.selector.on("mousedown", this.mouseDown.bind(this));
    this.selector.on("mouseup", this.mouseUp.bind(this));
    this.selector.on("mousemove", this.mouseMove.bind(this));
    this.selector.on("mouseout", this.mouseOut.bind(this));
};

Pr0Canvas.prototype.setText = function(text) {
    this.content.text = text;
};

Pr0Canvas.prototype.addImage = function(image, x, y, width, height) {
    this.content.images.push({img: image, pos: {x: x, y: y}, size: {width: width, height: height}});
};

Pr0Canvas.prototype.getBounds = function () {
    return this.element.getBoundingClientRect();
};

Pr0Canvas.prototype.dragOver = function (event) {
    var originalEvent = event.originalEvent;
    event.preventDefault();
    originalEvent.dataTransfer.dropEffect = 'copy';
    return false;
};

Pr0Canvas.prototype.drop = function (event) {
    var originalEvent = event.originalEvent;
    event.stopPropagation();
    event.preventDefault();
    var bounds = this.getBounds();

    var mouseX = originalEvent.clientX - bounds.left;
    var mouseY = originalEvent.clientY - bounds.top;

    if (originalEvent.dataTransfer.files.length > 0) {
        var file = originalEvent.dataTransfer.files[0];
        this.insertImageAtPosition(file, mouseX, mouseY);
    } else if (originalEvent.dataTransfer.getData("Text")) {
        var id = originalEvent.dataTransfer.getData("Text");
        var img = new Image();
        img.src = id;
        this.addImage(img, mouseX, mouseY, 100, 100);

        this.drawContent();
    }

    this.refreshCanvasDownloadSizeLabel();
};

//Partly taken from http://jsfiddle.net/m1erickson/LAS8L/
Pr0Canvas.prototype.mouseDown = function(event) {
    
    var bounds = this.getBounds();
    var mouseX = event.clientX - bounds.left;
    var mouseY = event.clientY - bounds.top;

    var mouseKey = event.which;

    if (mouseKey === 1) {

        $("#cb-edit-images").prop("checked", true);
        this.imageAnchors = true;
        if (event.shiftKey) {
            var img = this.hitImage(mouseX, mouseY);
            if (img > -1) {
                this.content.images.splice(img, 1);
            }
        }

        this.draggingResizer = this.anchorHitTest(mouseX, mouseY);
        if (this.draggingResizer.image < 0) {
            this.draggingImage = this.hitImage(mouseX, mouseY);
        }

    } else if (mouseKey === 3) {
        $("#cb-edit-images").prop("checked", false);
        this.imageAnchors = false;
        this.drawContent();
    }

    this.startX = mouseX;
    this.startY = mouseY;

};

Pr0Canvas.prototype.mouseUp = function() {
    this.draggingImage = -1;
    this.draggingResizer = -1;
    this.drawContent();
};

Pr0Canvas.prototype.mouseMove = function(event) {
    var bounds = this.getBounds();
    var mouseX = event.clientX - bounds.left;
    var mouseY = event.clientY - bounds.top;

    if (this.draggingResizer.image > -1) {

        var image = this.content.images[this.draggingResizer.image];
        var left = image.pos.x;
        var top = image.pos.y;
        var right = image.size.width + left;
        var bottom = image.size.height + top;
        var width = image.img.width;
        var height = image.img.height;
        var aspect = width / height;

        // resize the image
        switch (this.draggingResizer.corner) {
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
        if (this.keepAspectRatio) {
            width = height * aspect;
            // keep bottom fixed when dragging one of the top anchors
            if (this.draggingResizer.corner < 2) {
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

        this.drawContent();

    } else if (this.draggingImage > -1) {

        // move the image by the amount of the latest drag
        var dx = mouseX - this.startX;
        var dy = mouseY - this.startY;
        this.content.images[this.draggingImage].pos.x += dx;
        this.content.images[this.draggingImage].pos.y += dy;
        // reset the startXY for next time
        this.startX = mouseX;
        this.startY = mouseY;

        this.drawContent();

    }
};

Pr0Canvas.prototype.mouseOut = function(event) {
    this.draggingImage = -1;
    this.draggingResizer = -1;
    this.drawContent();
};

Pr0Canvas.prototype.insertImageAtPosition = function (image, x, y) {
    var that = this;
    if (image.type.match('image.*')) {
        var reader = new FileReader();
        reader.onload = function (evt) {
            var img = new Image();
            img.src = evt.target.result;
            img.onload = function() {
                if (y === -1) {
                    y =  that.context.canvas.height - img.height - 10;
                    if (y < 10) {
                        y =  10;
                    }
                }

                that.addImage(img, x, y, img.width, img.height);

                that.drawContent();
            };
        };
        reader.readAsDataURL(image);
        this.refreshCanvasDownloadSizeLabel();
    }
};

Pr0Canvas.prototype.refreshCanvasDownloadSizeLabel = function () {
    var binaryImage = this.dataURLtoBlob(this.element.toDataURL("image/png"));
    var size = (binaryImage.size / (1024 * 1024)).toFixed(2);
    var percentage =  100 - Math.round( size / 0.12);
    $("#div-image-info-size-cover").css("width", percentage + "%");
    $("#div-image-info-size-cover span").html(size + " MB");
};

Pr0Canvas.prototype.dataURLtoBlob = function (dataurl) {
    var arr = dataurl.split(',');
    var mime = arr[0].match(/:(.*?);/)[1];
    var bstr = atob(arr[1]);
    var n = bstr.length;
    var u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
};

Pr0Canvas.prototype.drawContentIncremental = function() {



};

Pr0Canvas.prototype.drawContent = function () {
    var context = this.context;
    var width = this.context.canvas.width;
    var height = this.context.canvas.height;

    var xPadding = 15;
    var yPadding = 15;

    var x = xPadding;
    var y = yPadding;

    var widestLine = 0;
    var widestImage = 0;
    var lowestImage = 0;

    context = this.initCanvasStyle(context, width, height);

    var lines = this.content.text.split("\n");


    for (var i = 0; i < lines.length; ++i) {

        var line = {
            x: x,
            y: y,
            text: lines[i],
            colorPositions: [],
            fontPositions: []
        };

        y += this.getLineMaxHeight(line.text);
        this.parseMarkers(line);

        this.renderLine(context, line, y);
        y += this.getLineOffset(line.text);

        if ((line.x + xPadding) > widestLine) {
            widestLine = line.x + xPadding;
        }


    }

    y += yPadding; // spacing bottom

    //Images
    for (var f = 0;f < this.content.images.length; ++f) {
        var img = this.content.images[f];
        context.drawImage(img.img, 0, 0, img.img.width, img.img.height, img.pos.x, img.pos.y, img.size.width, img.size.height);

        if (this.imageAnchors) {
            this.drawDragAnchor(img.pos.x, img.pos.y);
            this.drawDragAnchor(img.size.width + img.pos.x, img.pos.y);
            this.drawDragAnchor(img.size.width + img.pos.x, img.size.height + img.pos.y);
            this.drawDragAnchor(img.pos.x, img.size.height + img.pos.y);
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

    if ((widestElement | 0) !== context.canvas.width || (highestElement | 0) !== context.canvas.height) {
        context.canvas.width = widestElement;
        context.canvas.height = highestElement;
        this.drawContent();
    }
};

Pr0Canvas.prototype.initCanvasStyle = function(context, width, height) {
    context.fillStyle = Colors.richtigesGrau;
    context.fillRect(0, 0, width, height);
    context.font = Fonts.normal.style;
    context.fillStyle = Colors.schwuchtel;
    return context;
};


Pr0Canvas.prototype.getLineMaxHeight = function(line) {
    var lineHeight = 0;

    if (line.search("f.gross") > 0) {
        lineHeight = 45;
    } else if (line.search("f.normal") > 0) {
        lineHeight = 30;
    } else if (line.search("f.klein") > 0) {
        lineHeight = 15;
    } else {
        lineHeight = 20;
    }
    return lineHeight;
};

Pr0Canvas.prototype.parseMarkers = function(line) {
    var markerRe = /\${(.*?)}/;
    while ((match = markerRe.exec(line.text)) != null) {

        if (match[1].substring(0,2) === "c.") {
            line.colorPositions[match.index] = match[1].substring(2);
        } else if((match[1].substring(0,2) === "f.")) {
            line.fontPositions[match.index] = match[1].substring(2);
        }

        line.text = line.text.replace(markerRe, "");

    }
};

Pr0Canvas.prototype.getLineOffset = function(line) {
    var offset = 0;

    if(line.search("f.gross") > 0) {
        offset = 15;
    } else if (line.search("f.normal") > 0) {
        offset = 5;
    } else if (line.search("f.klein") > 0) {
        offset = 3;
    } else {
        offset = 5;
    }
    return offset;
};

Pr0Canvas.prototype.renderLine = function(context, line, y) {
    for (var c = 0; c <= line.text.length; ++c) {
        var chr = line.text.charAt(c);

        if (c in line.colorPositions) {
            context.fillStyle = Colors[line.colorPositions[c]];
        }

        if (c in line.fontPositions) {
            context.font = Fonts[line.fontPositions[c]];
        }

        context.fillText(chr, line.x, y);
        line.x += context.measureText(chr).width;
    }
};

Pr0Canvas.prototype.drawDragAnchor = function (x, y) {
    this.context.beginPath();
    var oldFillStyle = this.context.fillStyle;
    this.context.fillStyle = Colors["orange"];
    this.context.arc(x, y, 8, 0, Math.PI * 2, false);
    this.context.closePath();
    this.context.fill();
    this.context.fillStyle = oldFillStyle;
};

Pr0Canvas.prototype.anchorHitTest = function(x, y) {
    var dx, dy;

    for (var i = 0;i < this.content.images.length; ++i) {
        var imageX = this.content.images[i].pos.x;
        var imageY = this.content.images[i].pos.y;
        var imageRight = this.content.images[i].size.width + imageX;
        var imageBottom = this.content.images[i].size.height + imageY;

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
};

Pr0Canvas.prototype.hitImage = function (x, y) {
    for (var i = 0;i < this.content.images.length; ++i) {
        var imageX = this.content.images[i].pos.x;
        var imageY = this.content.images[i].pos.y;
        var imageWidth = this.content.images[i].size.width;
        var imageHeight = this.content.images[i].size.height;
        if (x > imageX && x < imageX + imageWidth && y > imageY && y < imageY + imageHeight) {
            return i;
        }
    }
    return -1;
};