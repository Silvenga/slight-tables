/*
 * Slight Tables
 * Deps: Bootstrap (CSS/JS/Fonts), jQuery, slight-tables.css
 * Notes: Some options only work on webkit/blink browsers
 * Mark Lopez (Silvenga) <m@silvenga.com>
 * 2/27/2015
 */

var SlightTable = function (table, options) {

    var parent = this;

    var $raw = table.find("tr");
    var $header = $raw.slice(0, 1);
    var $data = $raw.slice(1, $raw.length);

    this.table = table;
    this.header = $header;
    this.data = $data;
    this.filtered = $data;

    this.wrapperTop = $("<div>", { "class": "slight-top" });
    this.wrapperBot = $("<div>", { "class": "slight-bot" });

    this.wrapper = this.table.wrap($("<div/>", { "class": "slight-table" })).parent();

    this.table.wrap($("<div>", { "class": "slight-table-wrapper", "style": "overflow-x: auto" }));

    this.wrapper.prepend(this.wrapperTop.wrap($("<div/>", { "class": "slight-top-container" })).parent());
    this.wrapper.append(this.wrapperBot);

    this.settings = {
        index: 1,
        pages: 1,
        maxCols: 5,
        hiddenColumns: [],
        maxRowOptions: [10, 20, 50, 100],
        resizable: false
    };

    this.settings = $.extend({}, this.settings, options);

    for (var i = this.settings.maxCols + 1; i <= this.header.children().length; i++) {
        if (this.settings.hiddenColumns.indexOf(i) < 0) {
            this.settings.hiddenColumns.push(i);
        }
    }

    var rowOptions = $("<select>", { "class": "form-control slight-pselect" }).on("change", function () {
        parent.drawTable();
    });
    this.settings.maxRowOptions.forEach(function (item) {
        rowOptions.append($("<option>").attr("value", item).text(item));
    });

    this.rowOptions = rowOptions;

    this.rowStatus = $("<div>", { "class": "slight-status" });

    this.createCheckboxes();
    this.setupFilter();
    this.setupPagination();

    this.showPage(1);
}

SlightTable.prototype.next = function () {

    if (this.settings.index < this.settings.pages) {
        this.showPage(++this.settings.index);
    }
}

SlightTable.prototype.prev = function () {

    if (this.settings.index > 1) {
        this.showPage(--this.settings.index);
    }
}

SlightTable.prototype.showPage = function (index) {

    this.settings.index = parseInt(index);

    this.drawTable();
}

SlightTable.prototype.setupFilter = function () {

    this.filter = $("<input/>", {
        "type": "text",
        "class": "slight-search form-control"
    });

    var parrent = this;
    this.filter.on("keyup", function () {
        parrent.drawTable();
    });

    var filterContainer = $("<div>", { "class": "form-group has-feedback" });
    filterContainer.prepend($("<i class=\"glyphicon glyphicon-search form-control-feedback\"></i>"));
    filterContainer.prepend(this.filter);

    this.wrapperTop.prepend(filterContainer);
}

SlightTable.prototype.setupPagination = function () {

    this.pagerOptions = $("<div>", { "class": "slight-poptions" });

    this.pagerOptions.append(this.rowOptions);
    this.pagerOptions.append(this.rowStatus);

    this.pagerContainer = $("<nav/>", { "class": "slight-pager" });

    this.wrapperBot.append(this.pagerOptions);
    this.wrapperBot.append(this.pagerContainer);

    this.drawPager();
}

SlightTable.prototype.drawPager = function () {

    var parrent = this;
    var currentPage = this.settings.index;
    var rowsPerPage = this.rowOptions.val();
    var count = this.filtered.length;

    var pagesCount = Math.floor(count / rowsPerPage);
    if (count % rowsPerPage > 0) {
        pagesCount++;
    }

    if (currentPage > pagesCount && pagesCount > 0) {
        this.showPage(1);
        return;
    }

    this.settings.pages = pagesCount;

    var pager = $("<ul class=\"pagination\"></ul>");

    pager.prepend(
        $("<li id=\"prev\"><a href=\"#\"><span>&laquo;</span></a></li>").on("click", function () {
            parrent.prev();
        })
    );
    pager.prepend(
    $("<li id=\"first\"><a href=\"#\"><span>F</span></a></li>").on("click", function () {
        parrent.showPage(1);
    })
);
    pager.append(
        $("<li id=\"next\"><a href=\"#\"><span>&raquo;</span></a></li>").on("click", function () {
            parrent.next();
        })
    );
    pager.append(
    $("<li id=\"last\"><a href=\"#\"><span>L</span></a></li>").on("click", function () {
        parrent.showPage(pagesCount);
    })
);

    var pagesStart = 1;
    var pagesEnd = pagesCount;

    var range = 5;
    if (pagesCount > range) {

        range -= 3;

        pagesStart = currentPage - range;

        if (pagesStart < 1) {

            range -= pagesStart - 1;
            pagesStart = 1;
        }

        pagesEnd = currentPage + range;

        if (pagesEnd > pagesCount) {

            pagesStart -= pagesEnd - currentPage;
            pagesEnd = pagesCount;
        }
    }

    for (var i = pagesStart; i <= pagesEnd; i++) {
        var active = (this.settings.index == i) ? "active" : "";
        var $nextIndex = $("<li><a href=\"#\">" + i + "</a></li>").addClass(active)
            .on("click", function () {
                var pageNum = $(this).find("a").text();
                parrent.showPage(pageNum);
            });
        pager.find("#next").before($nextIndex);
    }

    this.pagerContainer.html(pager);

    var $rowsPerPage = this.rowOptions.val();
    var $rowStart = $rowsPerPage * (currentPage - 1);
    var $rowEnd = $rowsPerPage * (currentPage);

    var status = "Showing " + ++$rowStart + " to " + $rowEnd + " of " + count + " items in " + pagesCount + " pages.";
    this.rowStatus.text(status);
}

SlightTable.prototype.createCheckboxes = function () {

    var parrent = this;

    var checkboxes = $("<div/>", { "class": "slight-checkboxes" });
    this.table.find("th").each(function (col) {

        var index = col + 1;

        var $div = $("<div />", {
            "class": "checkbox"
        });

        var label = $("<label />").text($(this).text());

        var $checkbox = $("<input />", {
            type: "checkbox",
            id: index
        }).prop("checked", true);

        $checkbox.change(function () {

            if ($(this).is(":checked")) {
                parrent.showColumn(index);
            } else {
                parrent.hideColumn(index);
            }
        });

        if (parrent.settings.hiddenColumns.indexOf(index) >= 0) {
            $checkbox.prop("checked", false);
        }

        $checkbox.prependTo(label.appendTo($div.appendTo(checkboxes)));
    });

    var colButton = $("<div/>", { "class": "" });
    colButton.append($("<button/>", { "type": "button", "class": "btn btn-default" }).append($("<span>", { "class": "glyphicon glyphicon-eye-open" })));


    var settingsButton = $("<div/>", { "class": "" });
    settingsButton.append($("<button/>", { "type": "button", "class": "btn btn-default" }).append($("<span>", { "class": "glyphicon glyphicon-cog" })));

    colButton.popover({
        content: checkboxes,
        html: true,
        placement: "bottom"
    });

    // Reszing
    var resizable = $("<label />").text("Resizable");
    var resizableCheckbox = $("<input />", {
        type: "checkbox"
    }).prop("checked", false).change(function () {
        parrent.setResizable($(this).is(":checked"));
    });

    resizable.prepend(resizableCheckbox);
    var option = $("<div>", { "class": "checkbox" }).append(resizable);

    settingsButton.popover({
        content: option,
        html: true,
        placement: "bottom"
    });


    this.wrapperTop.append(colButton);
    this.wrapperTop.append(settingsButton);

    if (this.header.children().length > this.settings.maxCols) {
        colButton.tooltip({
            trigger: "manual",
            placement: "top",
            title: "Some columns were hidden. Click here to show."
        }).tooltip("show");

        setInterval(function () {
            colButton.tooltip("destroy");
        }, 5000);

        colButton.on("click", function () {
            colButton.tooltip("destroy");
        });
        settingsButton.on("click", function () {
            colButton.tooltip("destroy");
        });
    }

    // http://stackoverflow.com/questions/11703093/how-to-dismiss-a-twitter-bootstrap-popover-by-clicking-outside
    $("body").on("click", function (e) {
        $(".slight-table [data-original-title]").each(function () {
            if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $(".popover").has(e.target).length === 0) {
                $(this).popover("hide");
            }
        });
    });
}

SlightTable.prototype.setResizable = function (isResizable) {

    // Removes Chrome issues after reszing has been removed. 
    this.header.children().each(function () {
        $(this).css("width", "");
    });

    if (isResizable) {
        this.table.addClass("resizable");
    } else {
        this.table.removeClass("resizable");
    }

    this.drawTable();
}

SlightTable.prototype.drawTable = function () {

    var page = this.settings.index;

    var $rowsPerPage = this.rowOptions.val();
    var $rowStart = $rowsPerPage * (page - 1);
    var $rowEnd = $rowsPerPage * (page);

    this.filtered = this.data;

    // Sort/filter
    this.sortData();
    this.filterData();

    // Draw
    this.table.html(this.header);
    this.table.append(this.filtered.slice($rowStart, $rowEnd));

    // Fix Chrome's default tbody issues
    this.table.each(function () {
        var $this = $(this);
        $this.children("tbody").children().unwrap();
        $this.children("tr:has(th)").wrapAll("<thead>");
        $this.children("tr:has(td)").wrapAll("<tbody>");
    });

    // Attach events to new headers
    var parrent = this;
    this.header.find("th").each(function (index) {
        $(this).on("click", function () {
            parrent.sortColumn(index + 1);
            parrent.drawTable();
        });
    });

    // Reset all
    this.table.find("td,th").each(function () {
        $(this).show();
    });

    // Hide new
    for (var i = 0; i < this.settings.hiddenColumns.length; i++) {
        var column = this.settings.hiddenColumns[i];
        this.table.find("td:nth-child(" + column + "),th:nth-child(" + column + ")").hide();
    }

    this.drawPager();
}

SlightTable.prototype.hideColumn = function (index) {

    this.settings.hiddenColumns.push(index);
    this.drawTable();
}

SlightTable.prototype.showColumn = function (index) {

    var i = this.settings.hiddenColumns.indexOf(index);

    if (i > -1) {
        this.settings.hiddenColumns.splice(i, 1);
    }

    this.drawTable();
}

SlightTable.prototype.filterData = function () {

    var searchText = this.filter.val();
    if (searchText.length > 0) {

        searchText = searchText.toLocaleLowerCase();

        this.filtered = this.filtered.filter(function (index, item) {
            var contains = false;
            $(item).find("td").each(function () {
                contains = contains || $(this).text().toLocaleLowerCase().indexOf(searchText) > -1;
            });

            return contains;
        });
    }
}

SlightTable.prototype.sortData = function () {

    var parrent = this;

    var index = this.header.find("th").index($("[data-sort]"));
    var sort = $(this.header.find("th")[index]).data("sort");
    var reverse = $(this.header.find("th")[index]).data("reverse");

    if (index >= 0) {
        this.filtered = this.filtered.sort(function (a, b) {

            var aText = $($(a).find("td")[index]).text();
            var bText = $($(b).find("td")[index]).text();

            return parrent.comparer(aText, bText, sort);
        });

        if (reverse) {
            this.filtered = $(this.filtered.get().reverse());
        }
    }
}

SlightTable.prototype.sortColumn = function (index) {

    index--;
    var sort = this.findSortType(index);

    this.header.find("th").each(function (i) {

        $(this).find(".caret").remove();

        if (index == i) {

            $(this).attr("data-sort", sort);
            var reverse = ($(this).attr("data-reverse") == undefined) ? false : !$(this).data("reverse");
            $(this).attr("data-reverse", reverse);

            var car = (reverse) ? "caret caret-reversed" : "caret";

            $(this).append($("<span>", { "class": car }));

        } else {

            $(this).removeAttr("data-reverse");
            $(this).removeAttr("data-sort");
        }
    });

    this.drawTable();
}

SlightTable.prototype.comparer = function (a, b, sort) {

    if (sort == this.sortType.number) {
        return parseFloat(a) - parseFloat(b);
    } else if (sort == this.sortType.word) {
        return a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase());
    } else {
        return a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase());
    }
}

SlightTable.prototype.findSortType = function (index) {

    var isNum = true;
    for (var i = 0; i < this.filtered.length && isNum; i++) {

        var value = $($(this.filtered[i]).find("td")[index]).text();

        if (isNaN(parseFloat(value))) {
            isNum = false;
        }
    }

    return (isNum) ? this.sortType.number : this.sortType.word;
}

SlightTable.prototype.sortType = {
    number: 0,
    word: 1
}