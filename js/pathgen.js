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
    editmodes:ko.observableArray(["draw","edit"]),
    selectededitmode:ko.observable("edit"),
    paths:ko.observableArray(),
    selectedpath:ko.observable(""),
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
    defaultrotation:ko.observable(0),
    linewidth:5,
    mapofpaths:{},
    editor:null,
    rect:null,
    drawdirections:null,
    mousedown:false,
    bgimg:ko.observable(""),

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
        if(this.paper)
        {
            this.paper.clear();

        }
        else
        {
            this.paper = new Raphael("main","100%","100%");
        }

        var w;
        var h;
        w = element.offsetWidth;
        h = element.offsetHeight;
        this.rect = this.paper.rect(0,0,w,h);
        this.rect.data("parentPathGen",this);
        this.paper.parentPathGen = this;

        
        element.onmousedown = pathgen.onPaperMouseDown;
        element.onmouseup = pathgen.onPaperMouseUp;
        element.onmousemove = pathgen.onPaperMouseMove;
        element.parentPathGen = this;
        this.drawdirections = null;

    },
    requestPathSelectedChange: function(pathvalue)
    {
        var self = this;
        var obj = self.mapofpaths[pathvalue];
        if(obj != null)
        {
            self._pathFromJSON(obj);
            self.editor.set(obj);
        }
        
        self.pathName(pathvalue);
    },
    _setbgImg: function(path)
    {
        if(path)
        {
            this.rect.attr(
                {
                    fill: "url(" + path + ")"
                }
            );
        }
    },
    requestBGImageChange: function(path)
    {
        this._setbgImg(path);
    },
    requestSelectedEditModeChange: function(editmode)
    {
        console.log("Edit mode changed to " + editmode);
        var self  = this;
        if(editmode.toLowerCase() == "edit")
        {
            self._setEditModeEdit();
        }
        else
        {
            self._setEditModeDraw();
        }
    },
    _setEditModeDraw: function()
    {
        var self = this;
        self._initCanvas();
        /*
        Put some text on the background that explains how to enter into draw mode
        */
        var drawmodesteps = "Draw mode:\nStart drawing on mouse down, and draw your path.\nInclude all your pauses while holding the mouse.\n" +
        "When the mouse is released, you will be put into edit mode!"
        self.drawdirections = self.paper.text(self.screenwidth()/2 , self.screenheight()/2,drawmodesteps);  

    },

    _setEditModeEdit: function()
    {
        var self = this;
        self._initCanvas();
    },
    _isEditModeDraw: function()
    {
        return this.selectededitmode().toLowerCase() == "draw";
    },
    _isEditModeEdit: function()
    {
        return !this._isEditModeDraw();
    },
    initialize: function()
    {
        var pg = this;
        pg.sizePanels(pg.screenwidth(),pg.screenheight());

        pg.screenwidth.subscribe(pg.requestScreenWidthChange,pg);
        pg.screenheight.subscribe(pg.requestScreenHeightChange,pg);
        pg.selectedpath.subscribe(pg.requestPathSelectedChange,pg);
        pg.selectededitmode.subscribe(pg.requestSelectedEditModeChange,pg);
        pg.bgimg.subscribe(pg.requestBGImageChange,pg);
        ko.applyBindings(pg);
        pg.requestSelectedEditModeChange(pg.selectededitmode());



    },

    _findSegmentsFromPoint: function(c1)
    {
        var x;
        var pg = this;
        var segments = [];
        for(x = pg.segmentlist().length-1; x >= 0; x--)
        {
            if(pg.segmentlist()[x].data("c1") == c1)
            {
                segments.push(pg.segmentlist()[x]);

            }
            else if(pg.segmentlist()[x].data("c2") == c1)
            {
                segments.push(pg.segmentlist()[x]);
            }
        }

        return segments;
    },
    _deleteSegmentsFromPoint: function(c1)
    {
        var x;
        var pg = this;
        for(x = pg.segmentlist().length-1; x >= 0; x--)
        {
            if(pg.segmentlist()[x].data("c1") == c1)
            {
                pg.segmentlist()[x].remove();
                pg.segmentlist.splice(x,1);
            }
            else if(pg.segmentlist()[x].data("c2") == c1)
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
                return a.data("pointId") < b.data("pointId");
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
        var pg = this.data("parentPathGen");
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
        var pg = this.data("parentPathGen");
        if(!pg.isSelected(this))
        {
            this.attr({fill:pg.default_circle_fillcolor});
        }

    },
    lineHoverIn: function(e,x,y)
    {
        var pg = this.data("parentPathGen");
        if(this && pg)
        {
            this.attr({stroke:pg.default_line_hoverincolor});
        }
    },

    lineHoverOut: function(e,x,y)
    {
        var pg = this.data("parentPathGen");
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
    createLine: function(p1,p2,c1,c2,intervaltime,pg)
    {

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

        line.data("c1",c1);
        line.data("c2",c2);
        line.data("p1",p1);
        line.data("p2",p2);
        line.data("intervaltime",intervaltime? intervaltime : pg.defaulttime());

        line.data("description", "(" + p1.x + "," + p1.y +   "@" + c1.data("rotation") + ")" + "," + "(" + p2.x + "," + p2.y +  "@" + c2.data("rotation") + ")" + " :" + line.data("intervaltime") + "s");

        line.hover(pg.lineHoverIn, pg.lineHoverOut,line,line);
        line.click(pg.lineClicked);
        line.data("parentPathGen",pg);
        return line;
    },
    _makeDescription: function(p1,p2,c1,c2,intervaltime)
    {

       var v;
       v = "(" + p1.x + "," + p1.y +   "@" + c1.data("rotation") + ")" + "," + "(" + p2.x + "," + p2.y +  "@" + c2.data("rotation") + ")" + " :" + intervaltime + "s";
       return v;
    },
    _rotationPanelOK: function(currentpoint)
    {
        currentpoint.data("rotation",currentpoint.data("parentPathGen").defaultrotation());


        var elmtTable = document.getElementById('leftbarbody');
        var tableRows = elmtTable.getElementsByTagName('tr');
        var rowCount = tableRows.length;
        var x = 0;
        for (x=rowCount-1; x>0; x--) {
            elmtTable.removeChild(tableRows[x]);
        }

        if(x == 0 && tableRows.length > 0)
        {

            tableRows[x].innerHTML="<td class=\"description\" data-bind=\"text: data('description')\"></td>";
        }


        var segments = this._findSegmentsFromPoint(currentpoint);

        if(segments != null && segments.length > 0)
        {

            var p1,p2,c1,c2,intervaltime;


            for(x=0; x < segments.length; x++)
            {
                p1 = segments[x].data("p1");
                p2 = segments[x].data("p2");
                c1 = segments[x].data("c1");
                c2 = segments[x].data("c2");
                intervaltime = segments[x].data("intervaltime");
                segments[x].data("description",this._makeDescription(p1,p2,c1,c2,intervaltime));
            }
        }

        /*
        var alist = elmtTable.getElementsByTagName("td");
        if(alist != null && alist.length > 0)
        {
            var x,n;
            n = alist.length;
            for(x=0; x < n; x++)
            {
                alist[x].innerHTML='';
            }

        }*/
        ko.cleanNode(document.getElementById("leftbar"));
        ko.applyBindings(currentpoint.data("parentPathGen"), document.getElementById("leftbar"));
    },
    _linePanelOK: function(currentline)
    {
        currentline.data("intervaltime",currentline.data("parentPathGen").defaulttime());
        var c1 = currentline.data("c1");
        var c2 = currentline.data("c2");

        currentline.data("description", "(" + currentline.data("p1").x + "," + currentline.data("p1").y +  "@" + c1.data("rotation") + ")" + "," + "(" + currentline.data("p2").x + "," + currentline.data("p2").y +  "@" + c2.data("rotation") + ")" + " :" + currentline.data("intervaltime") + "s");
        var elmtTable = document.getElementById('leftbarbody');
        var tableRows = elmtTable.getElementsByTagName('tr');
        var rowCount = tableRows.length;
        for (var x=rowCount-1; x>0; x--) {
          elmtTable.removeChild(tableRows[x]);
        }
        var alist = elmtTable.getElementsByTagName("td");
        if(alist != null && alist.length > 0)
        {
            var x,n;
            n = alist.length;
            for(x=0; x < n; x++)
            {
               alist[x].innerHTML='';
            }
              
        }
        ko.cleanNode(document.getElementById("leftbar"));
        ko.applyBindings(currentline.data("parentPathGen"), document.getElementById("leftbar"));
    },
    lineClicked: function(e)
    {
        var currentline;
        currentline = this;
        e.preventDefault();
        document.getElementById("dialog-form-time").style.visibility="visible";
        $('#dialog-time').keypress(function(e) {
        if (e.keyCode == $.ui.keyCode.ENTER) {
            
            $(this).dialog("close");
            e.preventDefault();
            if(currentline && currentline.data("parentPathGen"))
            {
                currentline.data("parentPathGen")._linePanelOK(currentline);

                currentline = null;
            }
            return false;
        }
        });
        $("#dialog-time").dialog({ modal:true, buttons: [ { text: "Ok", click: function() { $( this ).dialog( "close" ); if(currentline){currentline.data("parentPathGen")._linePanelOK(currentline);}} } ] });
        
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

                var line = pg.createLine(p1,p2,a,b,null,pg);
                
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
        circle.data("pointId",pg.pointCounter);
        circle.data("parentPathGen",pg);
        circle.data("rotation",pg.defaultrotation());
        pg.pointCounter++;

        circle.attr("fill",pg.default_circle_fillcolor);
        circle.click(pg.pointClicked);
        circle.dblclick(pg.pointDoubleClicked);
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

            var line = pg.createLine(p1,p2,a,b,null,pg);
            
            pg.segmentlist.push(line);

        }
    },


    /*
     click handler for our canvas.  We'll put points here.
     */
    onPaperMouseDown: function(e)
    {
        if(!this.parentPathGen)
        {
            return;
        }
        this.parentPathGen.mousedown = true;
        if(this.parentPathGen._isEditModeEdit())
        {
            if(!e.defaultPrevented)
            {
                this.parentPathGen.addPoint(e.offsetX, e.offsetY);
            }


        }
        else if(this.parentPathGen._isEditModeDraw())
        {
            if(this.parentPathGen.drawdirections)
            {
                this.parentPathGen.drawdirections.remove();
                this.parentPathGen.drawdirections = null;
            }
            this.parentPathGen.addPoint(e.offsetX, e.offsetY);
        }
    },
    onPaperMouseUp: function(e)
    {
        if(!this.parentPathGen)
        {
            return;
        }
        this.parentPathGen.mousedown = false;
        if( this.parentPathGen._isEditModeEdit())
        {

            if(!e.defaultPrevented)
            {

            }


        }
        else if(this.parentPathGen._isEditModeDraw())
        {
            console.log("On Mouse Up");
        }
    },
    onPaperMouseMove: function(e)
    {
        if(!this.parentPathGen)
        {
            return;
        }
        if(this.parentPathGen._isEditModeDraw())
        {
            if(this.parentPathGen.mousedown)
            {
                this.parentPathGen.addPoint(e.offsetX, e.offsetY);
            }
        }
    },
    pointDoubleClicked: function(e)
    {
        var currentpoint;
        currentpoint = this;
        e.preventDefault();
        document.getElementById("dialog-form-rotation").style.visibility="visible";
        $('#dialog-rotation').keypress(function(e) {
        if (e.keyCode == $.ui.keyCode.ENTER) {
            
            $(this).dialog("close");
            e.preventDefault();
            if(currentpoint && currentpoint.data("parentPathGen"))
            {
                currentpoint.data("parentPathGen")._rotationPanelOK(currentpoint);

                currentpoint = null;
            }
            return false;
        }
        });
        $("#dialog-rotation").dialog({ modal:true, buttons: [ { text: "Ok", click: function() { $( this ).dialog( "close" ); if(currentpoint){currentpoint.data("parentPathGen")._rotationPanelOK(currentpoint);}} } ] });
        
    },
    pointClicked: function(e)
    {

        var pg = this.data("parentPathGen");
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
        var pg = this.data("parentPathGen");
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
                var intervaltime = line.data("intervaltime");
                
                line.remove();
                line.click(null);
                
                pg.segmentlist.splice(0,1);
                line =  pg.createLine(p1,p2,a,b,intervaltime,pg);
                
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
                var intervaltime = line.data("intervaltime");
                line.remove();
                
                pg.segmentlist.splice(avant,1);

                var p1 = {
                    x:a.attr('cx'),
                    y:a.attr('cy')
                };

                var p2 = {
                    x:this.attr('cx'),
                    y:this.attr('cy')
                };

                line =  pg.createLine(p1,p2,a,this,intervaltime,pg);
                
                pg.segmentlist.splice(avant,0,line);
                line = pg.segmentlist()[avant+1];
                intervaltime = line.data("intervaltime");
                line.remove();
                
                pg.segmentlist.splice(avant+1,1);

                var pp1 = {
                    x:this.attr('cx'),
                    y:this.attr('cy')
                };

                var pp2 = {
                    x:b.attr('cx'),
                    y:b.attr('cy')
                };

                line =  pg.createLine(pp1,pp2,this,b,intervaltime,pg);
                
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
                
                pg.segmentlist.splice(avant,1);

                var p1 = {
                    x:a.attr('cx'),
                    y:a.attr('cy')
                };

                var p2 = {
                    x:b.attr('cx'),
                    y:b.attr('cy')
                };

                line =  pg.createLine(p1,p2,a,b,intervaltime,pg);
                
                pg.segmentlist.splice(avant,0,line);
            }
        }


    },
    pointDragEnd: function(e)
    {
        e.preventDefault();

    },
    _emitError: function()
    {
        var errormap = {
            1:"Pathname invalid.",
            2:"Invalid JSON!"
        };

        var eno = arguments[0];
        if(errormap[eno] == null)
        {
            $.growl.error({ message: "unknown error" });
        }
        else
        {
            var msg = errormap[eno];
            var x;
            for(x=1; x < arguments.length; x++)
            {
                msg += " ";
                msg += arguments[x];
            }
            $.growl.error({ message: msg});
        }
    },
    _pathToJSON: function()
    {
        var obj = {};
        if(this.pathName() == null || this.pathName().length <= 0)
        {
            this._emitError(1);
            return null;
        }
        obj.pathName = this.pathName();
        obj.screenWidth = this.screenwidth();
        obj.screenHeight = this.screenheight();
        obj.defaultInterval = this.defaulttime()  + "";
        obj.defaultRotation = this.defaultrotation();
        obj.bgImg = this.bgimg();
        obj.segmentList = [];

        this.segmentlist().forEach( 
            function(i)
            {
                var seg;
                seg = {};
                seg.p1 = i.data("p1");
                seg.p2 = i.data("p2");
                seg.intervalTime = i.data("intervaltime") + "";
                obj.segmentList.push(seg);
            }
        );

        var idx = this.paths.indexOf(this.pathName());
        if(idx != -1)
        {

        }
        else
        {
            this.paths.push(this.pathName());
        }
        this.selectedpath(this.pathName());
        this.mapofpaths[this.pathName()] = obj;
        return obj;
    },
    onOutputJSON: function()
    {
        var self = this;
        var obj = self._pathToJSON();

        if(obj == null)
         return;

        self.editor.set(obj);

    },
    _pathFromJSON: function(obj)
    {

        var self = this;


        self.paper.clear();


        self.pathName(obj.pathName);

        if(self.paths.indexOf(obj.pathName) == -1)
        {
            self.paths.push(obj.pathName);
        }

        self.screenheight(obj.screenHeight);
        self.screenwidth(obj.screenWidth);
        self.defaulttime(obj.defaultInterval);
        self.defaultrotation(obj.defaultRotation);
        self.rect = this.paper.rect(0,0,this.screenwidth(),this.screenheight());
        self.rect.data("parentPathGen",self);
        var already = false;
        if(self.bgimg() == obj.bgImg)
        {
            already = true;
        }
        self.bgimg(obj.bgImg);
        var lastpoint = 0;
        self.segmentlist([]);
        self.pointlist=[];
        obj.segmentList.forEach( 
            
            function(e,i,arr)
            {
                if(i==0)
                {
                    self.addPoint(e.p1.x,e.p1.y);
                    self.addPoint(e.p2.x,e.p2.y);
                }
                else if(i+1 <= arr.length)
                {
                    if(lastpoint % 2 === 0)
                    {
                        self.addPoint(e.p1.x,e.p1.y);
                    }
                    else
                    {
                        self.addPoint(e.p2.x,e.p2.y);
                        lastpoint++;
                    }
                }
                
                
                lastpoint++;
               
            }
            );

        self.mapofpaths[self.pathName()] = obj;
        self._setbgImg(self.bgimg());



    },
    onInputJSON: function()
    {
        var self = this;
        try
        {
            var obj = self.editor.get();
            self._pathFromJSON(obj);
            self.editor.set(obj);
        }
        catch(v)
        {
            this._emitError(2, v.toString());
        }

    }

};
