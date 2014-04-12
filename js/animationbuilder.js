/**
 * Created by joshuateitelbaum on 4/5/14.
 */
"use strict";
function KeyFrameBlock(par,name)
{
    this.name = name;
    this.par = par;
    this.editimagesrc= ko.observable("");
    this.imageSrcs = ko.observableArray([]);

    this.addImageSource = function()
    {
        if(this.editimagesrc == null || this.editimagesrc() == null || this.editimagesrc().length <= 0)
        {

            return;
        }

        this.imageSrcs.push(this.editimagesrc());

    }
    this.removeImageSource = function()
    {
        var idx = this.imageSrcs().indexOf(this.editimagesrc());
        if(idx < 0)
        {
            animationbuilder._emitError(3);
            return;
        }

        if (idx > -1) {
            this.imageSrcs.splice(idx, 1);
        }
        if(this.imageSrcs().length > 0)
        {
            this.par.par.selectedimagesrc(this.imageSrcs()[0]);
        }
    }
}
function Animation(p,n,w,h)
{
	this.par = p;
	this.name =n;
	this.width = ko.observable(w);
	this.height = ko.observable(h);
    this.keyFrameBlocks= ko.observableArray([]);
    this.editkeyframeblock = ko.observable(new KeyFrameBlock(this,""));


    this.addImageSource = function()
    {
        this.editkeyframeblock().addImageSource();

    },
    this.removeImageSource = function()
    {
            this.editkeyframeblock().removeImageSource();

    },
    this.optionsImageSourceChanged = function(newvalue)
    {
        this.editkeyframeblock().editimagesrc(newvalue);
    },
    this.optionsKeyBlockChanged =  function(newvalue)
    {
        if(!newvalue)
            return;

        var block = this.findKeyFrameBlock(newvalue.name);


        if(block)
        {
            var newObject = jQuery.extend(true, {}, newvalue);
            this.editkeyframeblock(newObject);

        }
    }
    this.findKeyFrameBlock = function(name)
    {
        var x;
        var n;
        n = this.keyFrameBlocks().length;
        for(x=0; x < n; x++)
        {
            if(this.keyFrameBlocks()[x].name == name)
            {
                return this.keyFrameBlocks()[x];
            }
        }

        return null;
    }
    this.addKeyFrameBlock = function()
    {
        var self = this;


        if(self.editkeyframeblock().name.length <= 0)
        {
            animationbuilder._emitError(3);
            return;
        }
        var block = self.findKeyFrameBlock(self.editkeyframeblock().name);
        if(block != null)
        {
            animationbuilder._emitError(4);
            return;
        }
        var block = new KeyFrameBlock(self,self.editkeyframeblock().name);
        self.keyFrameBlocks.push(block);
        self.par.selectedkeyframeblock(block);


    }
    this.removeKeyFrameBlock = function()
    {
        var block = this.findKeyFrameBlock(this.editkeyframeblock().name);
        if(block == null)
        {
            animationbuilder._emitError(3);
            return;
        }
        var idx = this.keyFrameBlocks.indexOf(block);
        if (idx > -1) {
            this.keyFrameBlocks.splice(idx, 1);
        }
        if(this.keyFrameBlocks().length > 0)
        {
            var newObject = jQuery.extend(true, {}, this.keyFrameBlocks()[0]);
            this.par.selectedkeyframeblock(newObject);
        }
    }

}

var animationbuilder = {
	MAX_ANIMATION_WIDTH:320,
	MAX_ANIMATION_HEIGHT:240,
	animations:ko.observableArray([]),
    selectedanimation:ko.observable({}),
    editanimation:ko.observable(new Animation(this,"",0,0)),
    selectedkeyframeblock:ko.observable({}),
    selectedimagesrc:ko.observable(""),



    _emitError: function()
    {
        var errormap = {
            1:"Invalid animation width.",
            2:"Invalid animation height",
            3:"Invalid animation name",
            4:"Animation name alread exists",
            5:"No animations registered and chosen, cannot continue",
            6:"Keyframe block name invalid"
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
	beforeActivate: function(event,ui)
	{
		var self = document.animationbuilder;
		if(ui.oldPanel.attr("id") == "animationnames")
		{

			if((!self.editanimation) || (!self.editanimation()) || (self.editanimation().name.length <= 0))
			{
				self._emitError(5);
				return false;
			}
		}
        else if(ui.newPanel.attr("id") == "keyframes")
        {

        }
	},
	initialize:function()
	{
        this.selectedanimation.subscribe(this.optionsAnimationChanged,this);
        this.selectedkeyframeblock.subscribe(this.optionsKeyBlockChanged,this);
        this.selectedimagesrc.subscribe(this.optionsImageSourceChanged,this);
		ko.applyBindings(this);
		$( "#tabs" ).on( "tabsbeforeactivate", this.beforeActivate );
	},
    addKeyFrameBlock:function()
    {
        this.editanimation().addKeyFrameBlock();
    },
    removeKeyFrameBlock:function()
    {
        this.editanimation().removeKeyFrameBlock();
    },
    optionsImageSourceChanged:function(newvalue)
    {
        this.editanimation().optionsImageSourceChanged(newvalue);
    },
    optionsKeyBlockChanged: function(newvalue)
    {
        this.editanimation().optionsKeyBlockChanged(newvalue);
    },
	optionsAnimationChanged: function(newvalue)
	{
        if(!newvalue)
        return;

        var animation = this.findAnimationByName(newvalue.name);


        if(animation)
        {

            var newObject = jQuery.extend(true, {}, newvalue);
            this.editanimation(newObject);
        }
	},
	removeAnimationName: function()
	{
        var animation = this.findAnimationByName(this.editanimation().name);
        if(animation == null)
        {
            this._emitError(3);
            return;
        }
        var idx = this.animations.indexOf(animation);
        if (idx > -1) {
            this.animations.splice(idx, 1);
        }
        if(this.animations().length > 0)
        {
            var newObject = jQuery.extend(true, {}, this.animations()[0]);
            this.editanimation(newObject);

        }
	},


    findAnimationByName:function(name)
    {
        var animation = null;
        var x;
        var n;
        n = this.animations().length;
        for(x=0;x < n; x++)
        {
            if(this.animations()[x].name == name)
            {
                return this.animations()[x];
            }

        }
        return null;

    },
	addAnimationName: function()
	{
		var self = this;


		if(self.editanimation().name.length <= 0)
		{
			self._emitError(3);
			return;
		}
        var animation = self.findAnimationByName(self.editanimation().name);
        if(animation != null)
        {
            self._emitError(4);
            return;
        }
		var animation = new Animation(self,self.editanimation().name,self.editanimation().width(),self.editanimation().height());
		self.animations.push(animation);
        self.selectedanimation(animation);

	},
    addImageSource: function()
    {
        var self = this;
        if(self.editanimation().name.length <= 0)
        {
            self._emitError(3);
            return;
        }

        self.editanimation().addImageSource();

    },
    removeImageSource: function()
    {
        var self = this;
        if(self.editanimation().name.length <= 0)
        {
            self._emitError(3);
            return;
        }

        self.editanimation().removeImageSource();

    }

};