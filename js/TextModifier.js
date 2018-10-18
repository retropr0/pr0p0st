function TextModifier() {

}

TextModifier.prototype.getLineBreakPositions = function(text) {

};


TextModifier.prototype.justify = function(text, width) {
//Translated from https://github.com/mission-peace/interview/blob/master/src/com/interview/dynamic/TextJustification.java

    var words = text.split(" ");

    var cost = new Array(words.length);

    for(var i = 0 ; i < words.length; i++) {
        cost[i] = new Array(words.length);
        cost[i][i] = width - words[i].length;
        for(var j = i + 1; j < words.length; j++){
            cost[i][j] = cost[i][j-1] - words[j].length - 1;
        }
    }

    for(var i = 0; i < words.length; i++) {
        for(var j = i; j < words.length; j++) {
            if(cost[i][j] < 0) {
                cost[i][j] = Number.MAX_VALUE;
            } else {
                cost[i][j] = Math.pow(cost[i][j], 2);
            }
        }
    }

    var minCost = [];
    var result = [];

    for(var i = words.length - 1; i >= 0 ; i--) {
        minCost[i] = cost[i][words.length - 1];
        result[i] = words.length;
        for(var j = words.length - 1; j > i; j--) {
            if(cost[i][j-1] == Number.MAX_VALUE) {
                continue;
            }
            if(minCost[i] > minCost[j] + cost[i][j-1]){
                minCost[i] = minCost[j] + cost[i][j-1];
                result[i] = j;
            }
        }
    }

    var i = 0;
    var j = 0;

    var lines = [];

    do {
        j = result[i];

        var lineWords = [];

        for(var k = i; k < j; k++){
            lineWords.push(words[k]);
        }
        var line = lineWords.join(" ");

        line = this.fillRandomSpaces(line, width);
        lines.push(line);

        i = j;
    } while(j < words.length);

    return lines.join("\n");
};

TextModifier.prototype.fillRandomSpaces = function (line, width) {
    var difference = width - line.length;
    var words = line.split(" ");

    var wordCount = 0;
    while (difference--) {
        words[wordCount] += " ";
        wordCount++;
        if (wordCount === words.length - 1) {
            wordCount = 0;
        }
    }

    //Random looks more evenly but of course is not reproducible.
    // while(difference--) {
    //     var randomWord = Math.floor(Math.random() * (words.length - 2)) + 1;
    //     words[randomWord] += " ";
    // }

    return words.join(" ")
};
