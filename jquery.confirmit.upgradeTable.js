/**
 * Created by IvanP on 5/18/2016.
 */
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['jquery.upgradeTable'], factory);
    } else if (typeof exports === 'object') {
        // CommonJS
        factory(require('jquery'));
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    $.fn.upgradeTable = function(options){
        var defaults = {
            sorting:false, // set to true to enable
            sortable: null, // [column: Number, direction: 'asc|desc']
            sorted:[], //[[index, direction(asc|desc)]]
            mainHead: -1, // mainHeader, row that contains sorting functionality, -1 means last one, counts start from 0
            headerOverride: [] //  TODO: array of labels to override current ones
        };
        options = $.extend(true, {}, defaults, options);

        var mainframe={
            /*headerAbstraction:function(r){
             var e,n,l,t,a,i,o,h,c,f,p,s,b,d,w={};
             if(r&&r.children)for(e=0;e<r.children.length;e++)for(n=r.children[e],l=w[e]=w[e]||{},t=0,a=0;a<n.children.length;a++){if(i=n.children[a],o=i.colSpan,h=i.rowSpan,c=i.textContent,o||h||c){if(f=a,l.hasOwnProperty(a)){p=0,s=!1;for(b in l){if(parseInt(b)!==p){s=!0,f=p;break}p++}s||(f=p++)}for(b=e,h||(h=1),d=0;h>d;d++)h&&(b=e+d),w.hasOwnProperty(b)||(w[b]={}),w[b].hasOwnProperty(f)||(w[b][f]={},d===h-1?w[b][f].label=c.trim().length>0?c.trim():"":w[b][f].label=""),o>1&&(w[b][f].colspan=o);w[b]!==w[e]&&(l[f].label="")}else l[a].label="";t++}
             return w
             }*/
            _sortOrder:[],
            headerAbstraction:function(thead){
                var abstraction = {};
                if(thead){
                    var rowcount = thead.children.length;
                    for(var a=0;a<rowcount;a++){
                        var realRow = thead.children[a]; //real row
                        var aRow = abstraction[a] = abstraction[a] || {}; //abstraction row (might exist)
                        var aRowLength = 0;
                        for(var rowTD = 0; rowTD<realRow.children.length;rowTD++){
                            var curTD = realRow.children[rowTD]; //current cell
                            var colspan = curTD.colSpan, rowspan = curTD.rowSpan,label = curTD.textContent;
                            if(colspan||rowspan||label){
                                var finalTDcellIndex=rowTD;
                                // if entry exists (there was a rowspan in previous row and it transferred label to next possible row), we need to find a new home for curTD
                                // all cells are filled sequentially, so we need to find a break in indexing sequence
                                var key;
                                if(aRow.hasOwnProperty(rowTD)) { //this entry exists (it can exist if was filled by previous row where a cell had a rowspan)
                                    var realTDindex = 0, cellIsFound = false;
                                    for (key in aRow) {
                                        if (parseInt(key) === realTDindex) { realTDindex++ } else { cellIsFound = true; finalTDcellIndex = realTDindex; break;}
                                    }
                                    if(!cellIsFound){ //we've ran out of options with  realTDindex  cell, let's make it a realTDindex+1 ?
                                        finalTDcellIndex = realTDindex++;
                                    }
                                }
                                key = a; //is this current row or it has rowspan and we append label to the bottommost row?
                                if(!rowspan){rowspan=1}
                                for(var ri=0;ri<rowspan;ri++){
                                    if(rowspan){key=a+ri;}
                                    if(!abstraction.hasOwnProperty(key)){abstraction[key]={}}// is there such a row in abstraction?
                                    if(!abstraction[key].hasOwnProperty(finalTDcellIndex)){
                                        abstraction[key][finalTDcellIndex]={};
                                        if(ri===rowspan-1){ // if it's the last row
                                            abstraction[key][finalTDcellIndex].label = label.trim().length>0?label.trim():''; // use label if more than empty else empty string
                                        } else {abstraction[key][finalTDcellIndex].label = ''}
                                    }
                                    if(colspan>1){abstraction[key][finalTDcellIndex].colspan = colspan;}
                                }
                                if(abstraction[key]!==abstraction[a]){aRow[finalTDcellIndex].label = ''} // if there was rowspan, this cell is empty and needs empty label
                            } else {aRow[rowTD].label=''}
                            aRowLength++;
                        }
                    }
                }
                return abstraction;
            },
            /**
             * Creates normalized `tr`s for THEAD of the table and replaces that standard ones:
             * Normalized headers are single-row, all headings of headers with rowspan "fall" into the bottom-most row.
             * @param {Object} model - abstraction generated by `headerAbstraction`
             * @param {HTMLElement} thead - THEAD element of the table
             *
             * */
            generateHeader:function(model, thead){
                console.log(model);
                thead.innerHTML = '';
                for(var tr in model){
                    var row = document.createElement('tr');
                    for(var th in model[tr]){
                        var thEl = document.createElement('th');
                        thEl.textContent = model[tr][th].label;
                        thEl.colspan = model[tr][th].colspan;
                        row.appendChild(thEl);
                    }
                    thead.appendChild(row);
                }
            },
            /*
             * Default Header Row is a row that has sorting controls
             * */
            getDefaultHeaderRow:function(thead){
                return options.mainHead>-1? thead.children.item(options.mainHead) : thead.children.item(thead.children.length + options.mainHead)
            },
            /***/
            makeSortable:function(row,tbody){
                /*attach event listeners on sortable headers*/
                if(options.sortable == null){
                    [].slice.call(row.children).forEach(function(th){this.listenForSort(th)}.bind(this))
                } else if(Array.isArray(options.sortable) && options.sortable.length>0){
                    [].slice.call(row.children).forEach(function(th,index){
                        if(options.sortable.indexOf(index)>-1){
                            this.listenForSort(th);
                        }
                    }.bind(this))
                }
                /*attach event listener for sorting to happen*/
                $(this).on('tableSort',function(event){
                    var table = event.target,
                        tr = [].slice.call(tbody.children, 0), // put rows into array
                        i;
                    console.log(table);
                    tr = tr.sort(function (a, b) { // sort rows
                        if(table.sortOrder.length>1){
                            return table._sorter(a,b,table.sortOrder[0].column, table.sortOrder[0].direction === 'asc' ? -1 : 1) || table._sorter(a,b,table.sortOrder[1].column, table.sortOrder[1].direction === 'asc' ? -1 : 1)
                        } else {
                            return table._sorter(a,b,table.sortOrder[0].column, table.sortOrder[0].direction === 'asc' ? -1 : 1)
                        }
                    });
                    //console.log(dr.length);
                    for(i = 0; i < tr.length; ++i) tbody.appendChild(tr[i]); // append each row in order
                });

            },
            _sorter:function(a,b,idx,lesser){
                var x,y;
                x = a.children.item(idx).innerHTML; y = b.children.item(idx).innerHTML;
                var regex = /[<>]/g;
                if(regex.test(x) || regex.test(y)){ // if we need to sort elements that have HTML like links
                    var tempEl1 = document.createElement('span'); tempEl1.innerHTML = x;
                    x=tempEl1.textContent.trim();
                    var tempEl2 = document.createElement('span'); tempEl2.innerHTML = y;
                    y=tempEl2.textContent.trim();
                }
                if(!isNaN(parseFloat(x)) && !isNaN(parseFloat(y))){
                    return parseFloat(x) <  parseFloat(y) ? lesser :  parseFloat(x) >  parseFloat(y) ? -lesser : 0;
                } else {
                    return x.toLowerCase() < y.toLowerCase() ? lesser : x.toLowerCase() > y.toLowerCase() ? -lesser : 0;
                }
            },
            get sortOrder(){return this._sortOrder},
            set sortOrder(value){
                this._sortOrder=value;
            },
            listenForSort:function(el){
                $(el).on('click',function(event){
                    var th = event.target;
                    var index = th.cellIndex;
                    var table = $(this).closest('table');
                    if(!th.classList.contains('sorted')){ // this column is already sorted
                        $(th.parentElement).find('.sorted').each(function(){this.classList.remove('sorted','asc','desc')}); //null sorting on all other ths
                        th.classList.add('sorted','asc');
                        table[0].sortOrder=[{column:index, direction: 'asc'}];
                        table.trigger('tableSort');
                    } else { //swaps sorting from asc to desc
                        if(th.classList.contains('asc')){
                            th.classList.remove('asc');
                            th.classList.add('desc');
                            table[0].sortOrder=[{column:index, direction: 'desc'}];
                            table.trigger('tableSort');
                        } else {
                            th.classList.remove('desc');
                            th.classList.add('asc');
                            table[0].sortOrder=[{column:index, direction: 'asc'}];
                            table.trigger('tableSort');
                        }
                    }
                })
            }
        };

        // iterate through all tables matching selector
        $(this).each(function(index){
            $.extend(true, this, mainframe );

            var thead = $(this).find('thead')[0];
            var tbody = $(this).find('tbody')[0];
            this.generateHeader(this.headerAbstraction(thead), thead);
            this.makeSortable(this.getDefaultHeaderRow(thead),tbody);

            console.log(tbody);
        });
        

        console.log($(this));
        return this;
    }
}));