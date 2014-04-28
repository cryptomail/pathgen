/**
 * Created by joshuateitelbaum on 4/20/14.
 */
function PathGenLayoutManager(modality, maindivid, bottombardivid, outereditordivid, jsoneditordivid, w,h,dataurl)
{

    this.maindivid = maindivid;
    this.bottombardivid = bottombardivid;
    this.outereditordivid = outereditordivid;
    this.jsoneditordivid = jsoneditordivid;
    this.screenwidth= ko.observable(w);
    this.screenheight = ko.observable(h);
    this.modality = modality;
    this.editor = null;
    this.pathName=ko.observable("");
    this.paths=ko.observableArray();
    this.selectedpath=ko.observable("");
    this.mapofpaths={};
    this.bgimg=ko.observable("");
    this.layerids=ko.observableArray([]);
    this.selectedlayerid=ko.observable("");
    this.nLayers = 0;

    this.layers = {};


    this._getBottomMostLayer = function()
    {
        var idx = this.layerids().length-1;
        var bottom = this.layers[this.layerids()[idx]];
        if(this.selectedlayerid() == this.layerids()[idx] && idx > 0)
        {
            idx--;
        }
        bottom = this.layers[this.layerids()[idx]];
        return bottom;
    }
    this._getActiveLayer = function()
    {
        return this.layers[this.selectedlayerid()];
    }
    this.setcssOfElement= function(css, target)
    {
        if(!document.getElementById(target))
        {
            return;

        }
        for(var prop in css) {
            document.getElementById(target).style[prop] = css[prop];
        }
    }

    this.requestSelectedLayerIdChange = function(newval)
    {
        console.log("layerid selected: " + newval);

        var spacex = 10;
        var maincss =
        {

            "position":"fixed",
            "top": 8,
            "left":spacex,
            "width":this.screenwidth(),
            "height":this.screenheight(),
            "border-style":"solid",
            "border-width":2,
            "z-index":this.layerids().length+1,
            "opacity":1,
            "pointer-events":"auto",
            "pointerEvents":"auto"
        };


        this.setcssOfElement(maincss,newval);

        if(this.layers == null || this.layerids().length <= 0)
        {
            return;
        }
        var self = this;
        var opacitymult = 1.0/this.layerids().length;
        this.layerids().forEach( function(l,idx)
        {
          if(l != newval)
          {
              maincss["opacity"] = .5;
              maincss["z-index"] = idx+1;
              maincss["pointer-events"]="none";
              maincss["pointerEvents"]="none";
              self.setcssOfElement(maincss, l);

          }
        });

        this.layerids().forEach(function(l)
        {
            self.layers[l]._setbgImg("");
        });
        this._getBottomMostLayer()._setbgImg(this.bgimg());
    }

    this.removeElement= function(id)
    {
        var elem;
        return (elem=document.getElementById(id)).parentNode.removeChild(elem);
    }
    this.requestScreenWidthChange= function(newval)
    {
        this.sizePanels(newval,this.screenheight());
    }
    this.requestScreenHeightChange= function(newval)
    {
        this.sizePanels(this.screenwidth(),newval);
    }
    this.requestBGImageChange= function(path)
    {

        this._getBottomMostLayer()._setbgImg(path);
    }
    this.pathChanged = function(layerid, obj)
    {
        if(this.editor)
        {
            this.editor.set(obj);
        }
    }
    this.removeAllLayers = function()
    {
        var idx = this.layerids().length-1;
        if(idx < 0)
        {
            return;
        }
        while(idx >= 0)
        {
            this.selectedlayerid(this.layerids[idx]);
            idx--;
            this.onDelLayerClicked();
        }



    }
    /*
    sizePanels:  mobile:
    mobile wont' be able to do this
     */
    this.sizePanels = function(w, h)
    {
        this.removeAllLayers();
        var spacex = 10;
        w = parseInt(w);
        h = parseInt(h);
        var maincss =
        {

            "left":spacex,
            "width":w,
            "height":h,
            "border-style":"solid",
            "border-width":2
        };

        this.setcssOfElement(maincss,this.maindivid);

        var inputarea = document.getElementById(this.outereditordivid);
        var inputcss =
        {
            "position":"fixed",
            "top":8,
            "left":  w + spacex + maincss["border-width"],
            "width":400,
            "height":h,
            "border-style":"solid",
            "border-width":"2"
        };

        this.setcssOfElement(inputcss,this.outereditordivid);

        var bottomcss =
        {
            "position":"fixed",
            "top":h + maincss["border-width"]*4,
            "left":spacex,
            "width":  w+  inputcss["width"]   +  maincss["border-width"],
            "height":100,
            "border-style":"solid",
            "border-width":"2"
        };

        this.setcssOfElement(bottomcss,this.bottombardivid);

        var self = this;
        this.layerids().forEach(function(i)
        {
            self.layers[i]._initCanvas();
            self.layers[i].selectededitmode("");
            self.layers[i].selectededitmode("draw");
        }
        );

        if(this.editor)
        {
            var container = document.getElementById(this.outereditordivid);
            var edold = document.getElementById(this.jsoneditordivid);
            var style = edold.style;
            this.removeElement(this.jsoneditordivid);
            var e = document.createElement("div");
            e.id = this.jsoneditordivid;
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


    }
    this.onAddLayerClicked = function()
    {
        this.nLayers++;
        var layerid = "layer-" + this.nLayers;
        var div = document.createElement('div');
        div.id = layerid;
        var maindiv = document.getElementById(this.maindivid);


        var objTo = document.getElementById(this.maindivid);

        objTo.appendChild(div);
        var pathgen = new PathGen(layerid,layerid);
        this.layerids.push(layerid);
        this.layers[layerid] = pathgen;
        this.selectedlayerid(layerid);
        var self = this;

        this.layerids().forEach(function(l)
        {
            self.layers[l]._setbgImg("");
        });
        this._getBottomMostLayer()._setbgImg(this.bgimg());

        this._syncLayers(true);


    }
    this.selectedElapsedTime = function()
    {
        if((!this.layers) || !this.layers[this.selectedlayerid()])
        {
            return 0;
        }
        return this.layers[this.selectedlayerid()].elapsedtime();
    }
    this.onDelLayerClicked = function()
    {
        var target = this.selectedlayerid();


        var idx = this.layerids.indexOf(target);
        if(idx < 0)
        {
            return;
        }

        this.layers[target]._stopSimulation();

        if(this.layerids().length == 1)
        {
            this.layers[target]._initCanvas();
            this.layers[target].selectededitmode("draw");
        }
        else
        {
            delete this.layers[target];
            this.removeElement(target);
            this.layerids.splice(idx, 1);

        }

    }

    this.onSyncClicked = function()
    {
        this._syncLayers(false);
    }
    this._syncLayers = function(onlyrunning)
    {
        var self = this;
        this.layerids().forEach(function(id)
        {
            if(onlyrunning)
            {
                if(self.layers[id].selectededitmode()=="simulation")
                {
                    self.layers[id]._stopSimulation();
                    self.layers[id].selectededitmode("simulation");
                    self.layers[id]._startSimulation();
                }
            }
            else
            {
                self.layers[id]._stopSimulation();
                self.layers[id].selectededitmode("simulation");
                self.layers[id]._startSimulation();
            }

        });
    }
    this._getDataFromURL=function(url)
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

    }

    if(this.modality=="player")
    {
        if(this.bottombardivid && document.getElementById(this.bottombardivid))
        {
            document.getElementById(this.bottombardivid).style.display="none";
        }
        if(this.outereditordivid && document.getElementById(this.outereditordivid))
        {
            document.getElementById(this.outereditordivid).style.display="none";
        }
        if(this.jsoneditordivid && document.getElementById(this.jsoneditordivid))
        {
            document.getElementById(this.jsoneditordivid).style.display="none";
        }

    }


    this.sizePanels(w,h);
    this.screenwidth(w);
    this.screenheight(h);
    this.screenwidth.subscribe(this.requestScreenWidthChange,this);
    this.screenheight.subscribe(this.requestScreenHeightChange,this);
    this.selectedlayerid.subscribe(this.requestSelectedLayerIdChange,this);

    this.bgimg.subscribe(this.requestBGImageChange,this);


    if(dataurl == null || dataurl.length <= 0)
    {
        this.onAddLayerClicked();

    }
    else
    {
        //TODO load from URL
    }

    var self = this;
    ko.applyBindings(this);
}