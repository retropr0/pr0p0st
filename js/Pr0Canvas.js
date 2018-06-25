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

Pr0Canvas.prototype.drawContent = function () {
    var context = this.context;
    var width = this.context.canvas.width;
    var height = this.context.canvas.height;

    context.fillStyle = "#161618";
    context.fillRect(0, 0, width, height);
    context.font = "bold 20px 'Helvetica Neue', Helvetica, sans-serif";
    context.fillStyle = Colors["c.schwuchtel"];

    var lines = this.content.text.split("\n");
    var xPadding = 15;
    var yPadding = 15;

    var x = xPadding;
    var y = yPadding;

    var widestLine = 0;
    var widestImage = 0;
    var lowestImage = 0;

    for (var i = 0; i < lines.length; ++i) {
        x = 10;
        var colorPositions = {};
        var fontPositions = [];
        var markerRe = /\${(.*?)}/;

        var lh = 0, // line height
            offset = 0; // offset after line
        if(lines[i].search("f.gross")>0) {
            lh = 45;
            offset = 15
        } else if (lines[i].search("f.normal")>0) {
            lh = 20;
            offset = 5;
        } else if (lines[i].search("f.klein")>0) {
            lh = 15;
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
                context.fillStyle = Colors[colorPositions[c]];
            }
            if (c in fontPositions) {
                context.font = Fonts[fontPositions[c]];
                if (fontPositions[c] === "f.gross") {
                    lineHeight = 65;
                } else if (fontPositions[c] === "f.normal") {
                    lineHeight = 25;
                } else if (fontPositions[c] === "f.klein") {
                    lineHeight = 18;
                }

            }

            context.fillText(chr, x, y);
            x += context.measureText(chr).width;
        }

        y += offset;

        if ((x + xPadding) > widestLine) {
            widestLine = x + xPadding;
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

Pr0Canvas.prototype.drawDragAnchor = function (x, y) {
    this.context.beginPath();
    var styletmp = this.context.fillStyle;
    this.context.fillStyle = Colors["c.orange"];
    this.context.arc(x, y, 8, 0, Math.PI * 2, false);
    this.context.closePath();
    this.context.fill();
    this.context.fillStyle = styletmp;
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