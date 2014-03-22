/**
 * Created by joshuateitelbaum on 3/8/14.
 */
"use strict";
Raphael.fn.line = function(startX, startY, endX, endY, strokewidth){
    var ps =  this.path('M' + startX + ' ' + startY + ' L' + endX + ' ' + endY);
    ps.attr({"stroke-width":strokewidth});
    return ps;
};

var pathgen = {
    paper:null,
    pointlist: [],
    segmentlist: ko.observableArray(),
    selectedPoints:[],
    simulationmode:false,
    default_circle_radius:5,
    default_sqrt_radius:Math.sqrt(10),
    default_circle_fillcolor: "red",
    default_line_fillcolor: "black",
    default_circle_hoverincolor: "pink",
    default_line_hoverincolor: "green",
    default_circle_selectedcolor:"blue",
    pointCounter:0,
    screenwidth:ko.observable(320),
    screenheight:ko.observable(480),
    defaulttime:ko.observable(3),
    pathName:ko.observable(""),
    linewidth:5,
    editor:null,

    /*
     Initializes pathgen object.
     */

    setcssOfElement: function(css, target)
    {
        for(var prop in css) {
            document.getElementById(target).style[prop] = css[prop];
        }
    },
    removeElement: function(id)
    {
        var elem;
        return (elem=document.getElementById(id)).parentNode.removeChild(elem);
    },
    sizePanels: function(mainwidth, mainheight)
    {
        var spacex = 10;
        var leftbar = document.getElementById("leftbar");

        mainwidth = parseInt(mainwidth);
        mainheight = parseInt(mainheight);
        var leftbarcss =
        {

            "width":150,
            "height":mainheight,
            "border-style":"solid",
            "border-width":"2px",
            "overflow":"scroll"

        };


        this.setcssOfElement(leftbarcss,"leftbar");


        var maincss =
        {
            "left":leftbarcss.width + spacex,
            "width":mainwidth,
            "height":mainheight,
            "border-style":"solid",
            "border-width":2
        };

        var main = document.getElementById("main");
        this.setcssOfElement(maincss,"main");


        var inputarea = document.getElementById("outereditor");
        var inputcss =
        {

            "top":8,
            "left":leftbarcss.width + mainwidth + spacex + maincss["border-width"],
            "width":400,
            "height":mainheight,
            "border-style":"solid",
            "border-width":"2"
        };

        this.setcssOfElement(inputcss,"outereditor");

        var bottomcss =
        {

            "width":leftbarcss.width + mainwidth  + maincss["border-width"],
            "height":100,
            "border-style":"solid",
            "border-width":"2"
        };

        this.setcssOfElement(bottomcss,"bottombar");

        this._initCanvas();

        if(this.editor)
        {
            var container = document.getElementById("outereditor");
            var edold = document.getElementById("jsoneditor");
            var style = edold.style;
            this.removeElement("jsoneditor");
            var e = document.createElement("div");
            e.id = "jsoneditor";
            e.style = style;
            container.appendChild(e);
            
        }
        var container = document.getElementById("jsoneditor");
        var options = {
        mode: 'code',
        modes: ['code', 'form', 'text', 'tree', 'view'], // allowed modes
        error: function (err) {
          alert(err.toString());
        }
  };
        
        this.editor = new jsoneditor.JSONEditor(container,options);


    },
    requestScreenWidthChange: function(newval)
    {
        this.sizePanels(newval,this.screenheight());
    },
    requestScreenHeightChange: function(newval)
    {
        this.sizePanels(this.screenwidth(),newval);
    },
    _initCanvas: function()
    {

        this.pointlist = [];
        this.segmentlist.removeAll();

        var element = document.getElementById("main");
        if(!element)
        {
            return;
        }
        if(pathgen.paper)
        {
            pathgen.paper.clear();

        }
        else
        {
            pathgen.paper = new Raphael("main","100%","100%");
        }

        element.onclick = pathgen.onClickpaper;
    },
    initialize: function()
    {
        var pg = this;
        pg.sizePanels(pg.screenwidth(),pg.screenheight());

        pg.screenwidth.subscribe(pg.requestScreenWidthChange,pg);
        pg.screenheight.subscribe(pg.requestScreenHeightChange,pg);
        ko.applyBindings(pg);



    },

    _deleteSegmentsFromPoint: function(c1)
    {
        var x;
        var pg = this;
        for(x = pg.segmentlist.length-1; x >= 0; x--)
        {
            if(pg.segmentlist()[x].c1 == c1)
            {
                pg.segmentlist()[x].remove();
                pg.segmentlist.splice(x,1);
            }
            else if(pg.segmentlist()[x].c2 == c1)
            {
                pg.segmentlist()[x].remove();
                pg.segmentlist.splice(x,1);
            }
        }
    },
    _deletePoint: function(item)
    {
        /*
        1) find all segments related to point item
        2) delete those segments
        3) delete the point
        4) rejoin before and after
         */

        var idx,avantidx, apresidx,avant,apres;

        idx = this.pointlist.indexOf(item);
        if(idx < 0)
        {
            return;
        }
        avantidx = idx - 1;
        apresidx = idx + 1;

        if(avantidx < 0)
        {
            avant = null;
        }
        else
        {
            avant = this.pointlist[avantidx];
        }

        if(apresidx < 0)
        {
            apres = null;
        }
        else
        {
            apres = this.pointlist[apresidx];
        }

        this._deleteSegmentsFromPoint(item);

        item.remove();

        this.pointlist.splice(idx,1);


    },
    delClicked: function()
    {
        /*
         For each point selected, delete the point
         Then re-render the segments....tomorrow tired now :)
         */
        var pg = this;
        var traverselist = pg.selectedPoints.slice(0);

        traverselist.sort(
            function(a,b)
            {
                return a.pointId < b.pointId;
            }
        );
        traverselist.forEach( function(item)
        {
        pg._deletePoint(item);
        });

        pg._rebuildSegments();
        pg.selectedPoints = [];

    },
    isSelected: function(p)
    {
        return this.selectedPoints.indexOf(p) >= 0;
    },
    /*
     pointHoverIn
     */
    pointHoverIn: function(e,x,y)
    {
        var pg = this.parentPathGen;
        if(!pg.isSelected(this))
        {
            this.attr({fill:pg.default_circle_hoverincolor});
        }
    },
    /*
     pointHoverOut
     */
    pointHoverOut: function(e,x,y)
    {
        var pg = this.parentPathGen;
        if(!pg.isSelected(this))
        {
            this.attr({fill:pg.default_circle_fillcolor});
        }

    },
    lineHoverIn: function(e,x,y)
    {
        var pg = this.parentPathGen;
        if(this && pg)
        {
            this.attr({stroke:pg.default_line_hoverincolor});
        }
    },

    lineHoverOut: function(e,x,y)
    {
        var pg = this.parentPathGen;
        if(this && pg)
        {
            this.attr({stroke:pg.default_line_fillcolor});
        }

    },

    /*
     line angle
     */
    lineAngle: function(p1,p2)
    {
        var xDiff = p2.x - p1.x;
        var yDiff = p2.y - p1.y;
        return -Math.atan2(yDiff, xDiff);

    },
    createLine: function(p1,p2,c1,c2,intervaltime)
    {

        var pg = this;
        var lineangle = pg.lineAngle(p1,p2);


        var dx = Math.cos(lineangle) * pg.default_circle_radius;
        var dy = Math.sin(lineangle) * pg.default_circle_radius;
        var line = null;
        if(dx >= 0 && dy >= 0)
        {
            line = pg.paper.line(p1.x+dx,p1.y-dy,p2.x-dx,p2.y+dy,pg.linewidth);
        }
        else if(dx <=0 && dy <= 0)
        {
            line = pg.paper.line(p1.x+dx,p1.y-dy,p2.x-dx,p2.y+dy,pg.linewidth);
        }
        else if(dx >=0 && dy <= 0)
        {
            line = pg.paper.line(p1.x+dx,p1.y-dy,p2.x-dx,p2.y+dy,pg.linewidth);
        }
        else if(dx <= 0 && dy >= 0)
        {
            line = pg.paper.line(p1.x+dx,p1.y-dy,p2.x-dx,p2.y+dy,pg.linewidth);
        }

        line.c1 = c1;
        line.c2 = c2;
        line.p1 = p1;
        line.p2 = p2;
        line.intervaltime = intervaltime? intervaltime : pg.defaulttime();

        line.description = "(" + p1.x + "," + p1.y + ")" + "," + "(" + p2.x + "," + p2.y + ")" + " :" + line.intervaltime + "s";

        line.hover(pg.lineHoverIn, pg.lineHoverOut,line,line);
        line.click(pg.lineClicked);
        return line;
    },
    lineClicked: function(e)
    {
        
        e.preventDefault();
        document.getElementById("dialog-form-time").style.visibility="visible";
        $('#dialog-time').keypress(function(e) {
        if (e.keyCode == $.ui.keyCode.ENTER) {
            console.log("HI THERE");
            $(this).dialog("close");
            e.preventDefault();
            return false;
        }
        });
        $("#dialog-time").dialog({ modal:true, buttons: [ { text: "Ok", click: function() { $( this ).dialog( "close" ); } } ] });
        
    },
    _rebuildSegments: function()
    {

        var pg = this;
        pg.segmentlist().forEach( function(item)
        {
           item.remove();
        });

        pg.segmentlist.removeAll();
        if(pg.pointlist.length > 1)
        {
            var n;
            var x;
            n = pg.pointlist.length;
            for(x=1; x < pg.pointlist.length; x++)
            {
                var a = pg.pointlist[x -1];
                var b = pg.pointlist[x];

                var p1 = {
                    x:a.attr('cx'),
                    y:a.attr('cy')
                };

                var p2 = {
                    x:b.attr('cx'),
                    y:b.attr('cy')
                };

                var line = pg.createLine(p1,p2,a,b);
                line.parentPathGen = pg;
                pg.segmentlist.push(line);
            }

        }
    },
    /*
     addPoint
     Adds a point at x,y
     */
    addPoint: function(x,y)
    {
        var pg = this;
        var circle = pg.paper.circle(x,y,pg.default_circle_radius);
        circle.hover(pg.pointHoverIn,pg.pointHoverOut,circle,circle);
        circle.pointId = pg.pointCounter;
        circle.parentPathGen = pg;
        pg.pointCounter++;

        circle.attr("fill",pg.default_circle_fillcolor);
        circle.click(pg.pointClicked);
        pg.paper.set(circle).drag(pg.pointDragMove,pg.pointDragStart,pg.pointDragEnd);
        pg.pointlist.push(circle);
        if(pg.pointlist.length > 1)
        {
            var a = pg.pointlist[pg.pointlist.length -2];
            var b = pg.pointlist[pg.pointlist.length -1];

            var p1 = {
                x:a.attr('cx'),
                y:a.attr('cy')
            };

            var p2 = {
                x:b.attr('cx'),
                y:b.attr('cy')
            };

            var line = pg.createLine(p1,p2,a,b);
            line.parentPathGen = pg;
            pg.segmentlist.push(line);

        }
    },


    /*
     click handler for our canvas.  We'll put points here.
     */
    onClickpaper: function(e)
    {
        if(!self.simulationmode)
        {
            if(!e.defaultPrevented)
            {
                pathgen.addPoint(e.offsetX, e.offsetY);
            }

        }
        else
        {

        }
    },
    pointClicked: function(e)
    {

        var pg = this.parentPathGen;
        e.preventDefault();
        if(e.altKey)
        {
            var n;

            if((n=pg.selectedPoints.indexOf(this)) >= 0)
            {
                pg.selectedPoints.splice(n,1);
                this.attr({fill:pg.default_circle_fillcolor});
            }
            else
            {
                pg.selectedPoints.push(this);
                this.attr({fill:pg.default_circle_selectedcolor});
            }

        }
        else
        {
            var select = true;
            if(pg.selectedPoints.length == 1 && pg.selectedPoints[0] == this)
            {
                select = false;
            }
            pg.selectedPoints.forEach( function(item)
            {
                item.attr({fill:pg.default_circle_fillcolor});
            });
            pg.selectedPoints = [];
            if(select)
            {
                pg.selectedPoints.push(this);
                this.attr({fill:pg.default_circle_selectedcolor});
            }
        }
    },
    pointDragStart: function(x,y,e)
    {
        this.ox = this.attr("cx");
        this.oy = this.attr("cy");
        e.preventDefault();
    },
    pointDragMove: function(dx,dy)
    {
        this.attr({cx: this.ox + dx, cy: this.oy + dy});
        var pg = this.parentPathGen;
        var idx = pg.pointlist.indexOf(this);
        var avant = idx - 1;
        var apres = idx + 1;


        if(avant < 0)
        {

            if(apres < pg.pointlist.length)
            {
                avant = 0;
                var a = pg.pointlist[avant];
                var b = pg.pointlist[apres];

                var p1 = {
                    x:a.attr('cx'),
                    y:a.attr('cy')
                };

                var p2 = {
                    x:b.attr('cx'),
                    y:b.attr('cy')
                };

                /*
                 The target segment is between 0'th and 1st point, so the first segment.
                 */
                var line = pg.segmentlist()[0];
                var intervaltime = line.intervaltime;
                
                line.remove();
                line.parentPathGen = null;
                pg.segmentlist.splice(0,1);
                line =  pg.createLine(p1,p2,a,b,intervaltime);
                line.parentPathGen = pg;
                pg.segmentlist.splice(avant,0,line);
            }
            else
            {
                /*
                 Nothing to do, Tex! Nous sommes en seuls!
                 */
            }
        }
        else  /* There are points before us */
        {
            if(apres < pg.pointlist.length)
            {

                var a = pg.pointlist[avant];
                var b = pg.pointlist[apres];
                /*
                 Two segments!
                 */
                var line = pg.segmentlist()[avant];
                var intervaltime = line.intervaltime;
                line.remove();
                line.parentPathGen = null;
                pg.segmentlist.splice(avant,1);

                var p1 = {
                    x:a.attr('cx'),
                    y:a.attr('cy')
                };

                var p2 = {
                    x:this.attr('cx'),
                    y:this.attr('cy')
                };

                line =  pg.createLine(p1,p2,a,this,intervaltime);
                line.parentPathGen = pg;
                pg.segmentlist.splice(avant,0,line);
                line = pg.segmentlist()[avant+1];
                intervaltime = line.intervaltime;
                line.remove();
                line.parentPathGen = null;
                pg.segmentlist.splice(avant+1,1);

                var pp1 = {
                    x:this.attr('cx'),
                    y:this.attr('cy')
                };

                var pp2 = {
                    x:b.attr('cx'),
                    y:b.attr('cy')
                };

                line =  pg.createLine(pp1,pp2,this,b,intervaltime);
                line.parentPathGen = pg;
                pg.segmentlist.splice(avant+1,0,line);
            }
            else
            {
                /*
                 We're the last node on the chain!
                 It also means we're the last segment.
                 */
                apres = pg.pointlist.length-1;
                var a = pg.pointlist[avant];
                var b = pg.pointlist[apres];
                /*
                 The target segment is the same index as avant.
                 */
                var line = pg.segmentlist()[avant];
                var intervaltime = line.intervaltime;
                line.remove();
                
                line.parentPathGen = null;
                pg.segmentlist.splice(avant,1);

                var p1 = {
                    x:a.attr('cx'),
                    y:a.attr('cy')
                };

                var p2 = {
                    x:b.attr('cx'),
                    y:b.attr('cy')
                };

                line =  pg.createLine(p1,p2,a,b,intervaltime);
                line.parentPathGen = pathgen;
                pg.segmentlist.splice(avant,0,line);
            }
        }


    },
    pointDragEnd: function(e)
    {
        e.preventDefault();

    },
    _pathToJSON: function()
    {
        var obj = {};
        obj.pathName = this.pathName();
        obj.screenWidth = this.screenwidth();
        obj.screenHeight = this.screenheight();
        obj.defaultInterval = this.defaulttime()  + "";
        obj.segmentList = [];

        this.segmentlist().forEach( 
            function(i)
            {
                var seg;
                seg = {};
                seg.p1 = i.p1;
                seg.p2 = i.p2;
                seg.intervalTime = i.intervaltime + "";
                obj.segmentList.push(seg);
            }
        );

        return obj;
    },
    onOutputJSON: function()
    {
        var self = this;
        var obj = self._pathToJSON();

        self.editor.set(obj);
    },
    onInputJSON: function()
    {
        alert('hi');
    }

};
