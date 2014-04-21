/**
 * Created by joshuateitelbaum on 4/20/14.
 */
function PathGenLayoutManager(mainwidth,mainheight)
{
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
    this.removeElement= function(id)
    {
        var elem;
        return (elem=document.getElementById(id)).parentNode.removeChild(elem);
    }
    this.sizePanels = function(mainwidth, mainheight)
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

    }
    this.sizePanels(mainwidth,mainheight);
}