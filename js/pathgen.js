/**
 * Created by joshuateitelbaum on 3/8/14.
 */
"use strict";
Raphael.fn.line = function(startX, startY, endX, endY, strokewidth){
    var ps =  this.path('M' + startX + ' ' + startY + ' L' + endX + ' ' + endY);
    ps.attr({"stroke-width":strokewidth});
    return ps;
};


function sleep(millis, callback) {
    setTimeout(function()
        { callback(); }
        , millis);
}
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
/*
What is an animation?
*/
/*
1) Define a set of sprites from a sprite block
2) Define a set of keyframes that are named
3) A key frame is a set of coordinates (rectangle) into that sprite block
3) Define an array of times to spend in each key frame and name it
4) Each keyframe set instance will reference the timeblock
5) Each segment will point to by name the key frame set instance along with the time block

The rationale for splitting the keyframes from the time block is that an animation may take on the same keyframe block in the
sprite block, however, the animation speeds may be entirely different.
Imagine if you had two butterflies fluttering.  One butterfly could be flapping at a higher speed than another, or speed up 
or slow down the flapping at different intervals, however the key frame pointers would be identical, rather than defining them over
and over again :)

Dynamic Vectoring Selector:
If a keyframe set has a property called the Dynamic Vectoring Selector defined, or DVS, the system will switch to the appropriate 
keyframe block if not specified explicitly in the segment.

Concrete examples:
Animationsets:
{
    robot:
    {
        width:32,
        height:32,
        keyFrameBlockMap:
        {
            DVS:
            [
                {
                    min:0,
                    max:180,
                    selectKeyFrame:up
                },
                {
                    min:181,
                    max: 359,
                    selectKeyFrame:down
                }
            ],
            up:
            [

                    "http://pngup1.png",
                    "http://pngup2.png"

            ],
            down:
            [


                    "http://pngdown1.png",
                    "http://pngdown2.png"

            ]
        }
        timeBlockMap:
        {
            fast: [30,30],
            slow: [100,100]
        }
    }
}

DVS is a special reserved key that MAY not be overwritten.
Then a path will reference it by:
Path:
{
    defaultAnimationSet:robot,
    defaultAnimationSetTimeBlock:fast,
    defaultAnimationSetKeyFrameBlock:null,DVS
}

Then a segment may switch the animation block by:
segment:
{
    animationSet:robot,
    animationTimeBlock:slow,
    animationKeyFrameBlock:"up,down,DVS"
}
*/
var pathgen = {
    paper:null,
    editmodes:ko.observableArray(["draw","simulation"]),
    selectededitmode:ko.observable("draw"),
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
    captureinterval:null,
    currentX:0,
    currentY:0,
    starttime:0,
    elapsedtime:ko.observable(0),
    simulationrunning:false,
    modified:ko.observable(false),
    simulatorset:null,
    simulatorsegmentidx:0,
    pathgenversion:"1",
    animationinterval:null,
    animationsets:null,
    defaultAnimationSet:null,
    defaultAnimationSetTimeBlock:null,
    defaultAnimationSetKeyFrameBlock:null,
    currentAnimationFrameIndex:0,
    currentAnimationKeyFrameBlock:null,
    currentAnimationTimeBlock:null,
    maindivid:null,
    bottombardivid:null,
    outereditordivid:null,
    jsoneditordivid:null,
    /*
     Initializes pathgen object.
     */

    setcssOfElement: function(css, target)
    {
        if(!document.getElementById(target))
        {
            return;

        }
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

        mainwidth = parseInt(mainwidth);
        mainheight = parseInt(mainheight);


        var maincss =
        {
            "left":spacex,
            "width":mainwidth,
            "height":mainheight,
            "border-style":"solid",
            "border-width":2
        };


        this.setcssOfElement(maincss,this.maindivid);


        var inputarea = document.getElementById(this.outereditordivid);
        var inputcss =
        {

            "top":8,
            "left":  mainwidth + spacex + maincss["border-width"],
            "width":400,
            "height":mainheight,
            "border-style":"solid",
            "border-width":"2"
        };

        this.setcssOfElement(inputcss,this.outereditordivid);

        var bottomcss =
        {
            "position":"fixed",
            "top":mainheight + maincss["border-width"]*4,
            "left":spacex,
            "width":  mainwidth +  inputcss["width"]   +  maincss["border-width"],
            "height":100,
            "border-style":"solid",
            "border-width":"2"
        };

        this.setcssOfElement(bottomcss,this.bottombardivid);

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
        var container = document.getElementById(this.jsoneditordivid);
        var options = {
        mode: 'code',
        modes: ['code', 'form', 'text', 'tree', 'view'], // allowed modes
        error: function (err) {
          alert(err.toString());
        }
        };
        if(container)
        {
            this.editor = new jsoneditor.JSONEditor(container,options);
        }

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

        var element = document.getElementById(this.maindivid);
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
            this.paper = new Raphael(this.maindivid,"100%","100%");
        }

        var w;
        var h;
        w = element.offsetWidth;
        h = element.offsetHeight;
        this.rect = this.paper.rect(0,0,w,h);
        this.rect.data("parentPathGen",this);
        this.paper.parentPathGen = this;
        element.parentPathGen = this;
        this.drawdirections = null;

    },
    requestPathSelectedChange: function(pathvalue)
    {
        if(!pathvalue)
        {
            return;
        }
        var self = this;
        var obj = self.mapofpaths[pathvalue];

        if(self._isEditModeSimulation())
        {
            self._stopSimulation();
        }
        else if(self._isEditModeDraw())
        {
            self.selectededitmode("simulation");
        }
        if(obj != null)
        {
            self._pathFromJSON(obj);
            self.editor.set(obj);
        }
        if(self._isEditModeSimulation())
        {
            self._putSimulatorText();
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

        if(this._isEditModeDraw())
        {
            self._setEditModeDraw();
        }
        else if(this._isEditModeSimulation())
        {
            self._setEditModeSimulation();
        }
        if((!this._isEditModeDraw()) && self.pathName() != null && self.pathName().length > 0)
        {
            self.requestPathSelectedChange(self.pathName());
        }
        else
        {
            self._setbgImg(self.bgimg());
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
        self.drawdirections.attr({ "font-size": 10, "fill":"black","font-family": "Arial, Helvetica, sans-serif" });
        var element = document.getElementById(this.maindivid);
        element.onclick = null;
        element.onmousedown = pathgen.onPaperMouseDown;
        element.onmouseup = pathgen.onPaperMouseUp;
        element.onmousemove = pathgen.onPaperMouseMove;
        element.onmouseout = pathgen.onPaperMouseOut;
        self.pathName("");

    },
    _putSimulatorText: function()
    {
        this._removeSimulatorText();
        var drawmodesteps = "Simulation mode:\nClick to begin!"
        this.drawdirections = this.paper.text(this.screenwidth()/2 , this.screenheight()/2,drawmodesteps);
        this.drawdirections.attr({ "font-size": 16, "fill":"black","font-family": "Arial, Helvetica, sans-serif" });

    },
    _removeSimulatorText: function()
    {
      if(this.drawdirections)
      {
          this.drawdirections.remove();
          this.drawdirections = null;
      }
    },
    _setEditModeSimulation: function()
    {
        var self = this;

        self._initCanvas();

        this._putSimulatorText();

        var element = document.getElementById(self.maindivid);
        element.onclick = pathgen.onPaperClick;
        element.onmousedown = null;
        element.onmouseup = null;
        element.onmousemove = null;


    },


    _flattenPoints: function()
    {
        var self = this;
        var pt = [];
        if(self.pointlist == null)
        {
            return null;
        }
        self.pointlist.forEach(
            function(i)
            {
                var p;
                p = [];
                p.push(i.attr("cx"));
                p.push(i.attr("cy"));
                pt.push(p);
            }
        );

        return pt;
    },
    _setEditModeEdit: function()
    {
        var self = this;
        var result = null;

        self._initCanvas();

        var element = document.getElementById(self.maindivid);
        element.onclick = pathgen.onPaperClick;
        element.onmousedown = null;
        element.onmouseup = null;
        element.onmousemove = pathgen.onPaperMouseMove;



    },
    _isEditModeDraw: function()
    {
        return this.selectededitmode().toLowerCase() == "draw";
    },
    _isEditModeSimulation: function()
    {
        return this.selectededitmode().toLowerCase() == "simulation";
    },

    initialize: function(maindivid,bottombardivid,outereditordivid,jsoneditordivid)
    {
        var pg = this;
        pg.maindivid = maindivid;
        pg.bottombardivid = bottombardivid;
        pg.outereditordivid = outereditordivid;
        pg.jsoneditordivid = jsoneditordivid;
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
   
  
    isSelected: function(p)
    {
        return this.selectedPoints.indexOf(p) >= 0;
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
        var delta = Math.abs(c1.data("time")-c2.data("time"));
        line.data("intervaltime",intervaltime? intervaltime : delta);

        line.data("description", "(" + p1.x + "," + p1.y +   "@" + c1.data("rotation") + ")" + "," + "(" + p2.x + "," + p2.y +  "@" + c2.data("rotation") + ")" + " :" + line.data("intervaltime") + "ms");



        line.data("parentPathGen",pg);
        return line;
    },
    _makeDescription: function(p1,p2,c1,c2,intervaltime)
    {

       var v;
       v = "(" + p1.x + "," + p1.y +   "@" + c1.data("rotation") + ")" + "," + "(" + p2.x + "," + p2.y +  "@" + c2.data("rotation") + ")" + " :" + intervaltime + "s";
       return v;
    },


   
    /*
     addPoint
     Adds a point at x,y
     */
    addPoint: function(x,y,thetime)
    {
        var pg = this;
        pg.modified(true);
        var circle = pg.paper.circle(x,y,pg.default_circle_radius);

        circle.data("pointId",pg.pointCounter);
        circle.data("parentPathGen",pg);
        circle.data("rotation",pg.defaultrotation());
        var d = new Date();
        var n = d.getTime();
        circle.data("time",thetime!=null?thetime:n);

        pg.pointCounter++;

        circle.attr("fill",pg.default_circle_fillcolor);
        
        
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


    onTimer: function()
    {

        //console.log("x: " + + " y: "+ this.pathgen.currentY);
        this.pathgen.addPoint(this.pathgen.currentX,this.pathgen.currentY);

        var d = new Date();
        var n = d.getTime();
        this.pathgen.elapsedtime((n-this.pathgen.starttime)/1000);
    },
    onPaperClick: function(e)
    {
        if(!this.parentPathGen)
        {
            return;
        }

        if(this.parentPathGen._isEditModeSimulation())
        {
            if(this.parentPathGen.simulationrunning)
            {
                this.parentPathGen._stopSimulation();
            }
            else
            {
                this.parentPathGen._startSimulation();
            }
            return true;
        }

    },

    _showAllPaperElements: function(show, types)
    {
        var bot = this.paper.bottom, res = [];
        while (bot) {
            res.push(bot);
            bot = bot.next;
        }
        res.forEach(
            function(i)
            {
                if(types.indexOf(i.type) != -1)
                {
                    if(!show)
                    {
                        i.hide();
                    }
                    else
                    {
                        i.show();

                    }
                }
            }
        );
    },
    _startSimulation: function()
    {
        var self  = this;
        if(self.simulationrunning)
        {
            self._stopSimulation();
        }
        console.log("start simulation");
        self.simulationrunning = true;
        self._removeSimulatorText();
        self._showAllPaperElements(false,["rect","circle","path"]);
        self._showAllPaperElements(true,["rect"]);

        self.simulatorset = self.paper.set();

        var simulatorpoint = null;

        /*
        If an animation: simulatorpoint = self.paper.image(url,0,0,32,32);
         */
        var animating = false;
        if(self.animationsets != null  && self.defaultAnimationSet != null && self.defaultAnimationSetKeyFrameBlock != null && self.defaultAnimationSetTimeBlock != null)
        {

           var frameset = self.animationsets[self.defaultAnimationSet];
           if(frameset != null && frameset.keyFrameBlockMap && frameset.timeBlockMap)
           {
               self.currentAnimationKeyFrameBlock = frameset.keyFrameBlockMap[self.defaultAnimationSetKeyFrameBlock];
               self.currentAnimationTimeBlock = frameset.timeBlockMap[self.defaultAnimationSetTimeBlock];
               self.currentAnimationFrameIndex = 0;
               if(self.currentAnimationKeyFrameBlock && self.currentAnimationTimeBlock &&
                   self.currentAnimationKeyFrameBlock.length > 0 && self.currentAnimationTimeBlock.length > 0)
               {
                   var url = self.currentAnimationKeyFrameBlock[self.currentAnimationFrameIndex];
                   if(url && url.length > 0)
                   {
                     simulatorpoint = self.paper.image(url,0,0,frameset.width,frameset.height);
                       animating = true;
                   }
               }
           }
        }
        if(simulatorpoint == null)
        {
            simulatorpoint = self.paper.circle(0,0,self.default_circle_radius);
            simulatorpoint.attr("fill",self.default_circle_fillcolor);
        }
        simulatorpoint.data(("parentPathGen"),self);
        self.simulatorset.push(simulatorpoint);
        self.simulatorset.translate(self.pointlist[0].attr("cx"),self.pointlist[0].attr("cy"));
        
        
        
        self.simulatorset.animate({fill: self.default_circle_fillcolor},0,"linear",self._segmentDone);
        self.simulatorsegmentidx = -1;
        if(animating)
        {
            self.animationinterval = setTimeout(function(){self.onAnimationTimer(self);},self.currentAnimationTimeBlock[self.currentAnimationFrameIndex]);
        }

    },
    onAnimationTimer: function(par)
    {

        par.currentAnimationFrameIndex = par.currentAnimationFrameIndex + 1;

        par.currentAnimationFrameIndex = par.currentAnimationFrameIndex % par.currentAnimationTimeBlock.length;

        var url = par.currentAnimationKeyFrameBlock[par.currentAnimationFrameIndex];

        var timeout = par.currentAnimationTimeBlock[par.currentAnimationFrameIndex % par.currentAnimationTimeBlock.length];

        par.animationinterval  = setTimeout(function(){par.onAnimationTimer(par);},par.currentAnimationTimeBlock[par.currentAnimationFrameIndex]);

        par.simulatorset[0].attr({src:url});

        return;
    },
    _segmentDone: function()
    {

        var pg = this.items[0].data("parentPathGen");
        if(pg.simulationrunning == false)
        {
            return;
        }
        pg.simulatorsegmentidx = (pg.simulatorsegmentidx + 1) % pg.segmentlist().length;
        var cx,cy,rot,ms;
        rot = 0;
        cx = pg.segmentlist()[pg.simulatorsegmentidx].data("p2").x;
        cy = pg.segmentlist()[pg.simulatorsegmentidx].data("p2").y;
        ms = pg.segmentlist()[pg.simulatorsegmentidx].data("intervaltime");
        pg.simulatorset.animate({transform: "t"+cx + ","+ cy + "r"+rot},ms,"linear",pg._segmentDone);

    },
    _stopSimulation: function()
    {
        var self  = this;

        if(self.simulationrunning == false)
        {
            return;
        }

        if(self.animationinterval)
        {
            clearInterval(self.animationinterval);
        }
        
        self.animationinterval = null;

        if(self.simulatorset)
        {
            self.simulatorset.remove();
            self.simulatorset = null;
        }

        console.log("stop simulation");

        self._putSimulatorText();
        self._showAllPaperElements(true,["rect","circle","path"]);
        self.simulationrunning = false;
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

        if(this.parentPathGen._isEditModeDraw())
        {
            if(this.parentPathGen.mousedown)
            {
                this.parentPathGen._performMouseUp();
                return;
            }
            if(this.parentPathGen.drawdirections)
            {
                this.parentPathGen.drawdirections.remove();
                this.parentPathGen.drawdirections = null;
            }
            var d = new Date();
            var n = d.getTime();
            this.parentPathGen.starttime = n;
            this.parentPathGen.addPoint(e.offsetX, e.offsetY);
            this.parentPathGen.captureinterval = setInterval(this.parentPathGen.onTimer,10);
            this.parentPathGen.mousedown=true;
        }
    },
    _findTempPathName: function()
    {
        var self = this;
        var x=0;
        var namebase = "tsetse_";
        while(true)
        {

            var name = namebase + x;
            if(!self.mapofpaths[name])
            {
                return name;
            }
            x++;
        }
        return null;
    },
    _performMouseUp: function()
    {
        var self = this;

        self.mousedown = false;
        if(self.captureinterval)
        {
            clearInterval(self.captureinterval);
        }

        var xx = self._collapsePoints();
        
        self.pointlist = xx;
        
        if(self.pathName && self.pathName().length == 0)
        {
            self.pathName(self._findTempPathName());

        }
        if(!(self.pointlist == null || self.pointlist.length == 0))
        {
            self.onOutputJSON();
            self.selectededitmode("simulation");
            self.onInputJSON();
        }
        

    },
    onPaperMouseUp: function(e)
    {
        var self = this;
        if(!self.parentPathGen)
        {
            return false;
        }
        self.parentPathGen._performMouseUp();

    },
    onPaperMouseOut: function(e)
    {
        var self = this;
        if(!self.parentPathGen)
        {
            return false;
        }
        if( self.parentPathGen._isEditModeDraw() && e.toElement && !e.toElement.nodeName == "svg")
        {
            
            self.parentPathGen._performMouseUp();
        }
    },
    _collapsePoints: function()
    {
        var self = this;
        var x;
        var n;
        if(self.pointlist == null)
        {
            return self.pointlist;
        }
        var newlist = [];
        if(self.pointlist.length <= 2)
        {
            self.pointlist.forEach(
                function(i)
                {
                    newlist.push(i);
                }
            );

            return newlist;
        }
        n = self.pointlist.length;
        var anchor = null;
        var delta = 0;
        anchor = self.pointlist[0];

        newlist.push(anchor);
        for(x=1; x < n - 1; x++)
        {
            if(anchor.attr("cx") == self.pointlist[x].attr("cx") &&
                anchor.attr("cy") == self.pointlist[x].attr("cy") )
            {



            }
            else
            {
                anchor = self.pointlist[x];
                newlist.push(anchor);
            }
        }

        newlist.push(self.pointlist[x]);

        return newlist;

    },
    onPaperMouseMove: function(e)
    {
        if(!this.parentPathGen)
        {
            return;
        }
        this.parentPathGen.currentX = e.offsetX;
        this.parentPathGen.currentY = e.offsetY;
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
        obj.pathgenVersion = this.pathgenversion;
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
                seg.t = i.data("intervaltime") + "";
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

        self.modified(false);
    },
    _validateObject_1: function(obj)
    {
        /*
        stubbed heh
        TODO: validate!!
        */
        return 0;
    },
    _pathFromJSON: function(obj)
    {

        var self = this;


        self.paper.clear();

        if((!obj.pathgenVersion) || obj.pathgenVersion == "1")
        {
            var eno = 0;
            if((eno=this._validateObject_1(obj)) != 0)
            {
                this._emitError(2);
                return;
            }
        }
        self.pathName(obj.pathName);

        if(self.paths.indexOf(obj.pathName) == -1)
        {
            self.paths.push(obj.pathName);
        }
        self.animationsets = obj.animationSets;
        self.defaultAnimationSet = obj.defaultAnimationSet;
        self.defaultAnimationSetKeyFrameBlock = obj.defaultAnimationSetKeyFrameBlock;
        self.defaultAnimationSetTimeBlock = obj.defaultAnimationSetTimeBlock;
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
                    self.addPoint(e.p1.x,e.p1.y,0);
                    self.addPoint(e.p2.x,e.p2.y, e.t);
                }
                else if(i+1 <= arr.length)
                {
                    if(lastpoint % 2 == 0)
                    {
                        self.addPoint(e.p1.x,e.p1.y,0);
                    }
                    else
                    {
                        self.addPoint(e.p2.x,e.p2.y, self.pointlist[i].data("time")-  e.t);
                        //self.addPoint(e.p2.x,e.p2.y, e.intervalTime);
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
            if(self._isEditModeSimulation())
            {
                self._stopSimulation();
            }

            var obj = self.editor.get();
            self._pathFromJSON(obj);
            self.editor.set(obj);
            if(self._isEditModeSimulation())
            {
                self._putSimulatorText();

            }
        }
        catch(v)
        {
            this._emitError(2, v.toString());
        }

    },
    _getDataFromURL: function(url)
    {

        var self = this;
        $.get('http://jsonp.jit.su/?url=' + encodeURI(url), function(data)
            {


                try
                {
                    if(self._isEditModeSimulation())
                    {
                        self._stopSimulation();
                    }
                    self._pathFromJSON(data);
                    if(self.editor)
                    {
                        self.editor.set(data);
                    }
                    self._startSimulation();
                }
                catch(v)
                {
                    self._emitError(2, v.toString());
                }
            }
        );

    },
    loadFromURL: function(url)
    {
        this._getDataFromURL(url);
    }

};