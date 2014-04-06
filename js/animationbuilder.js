/**
 * Created by joshuateitelbaum on 4/5/14.
 */
"use strict";
function Animation(n,w,h)
{
	
	this.name =n;
	this.width = w;
	this.height = h;
}

var animationbuilder = {
	MAX_ANIMATION_WIDTH:320,
	MAX_ANIMATION_HEIGHT:240,
	animationnames:ko.observableArray([]),
	selectedanimationname:ko.observable(""),
	selectedanimationwidth:ko.observable(0),
	selectedanimationheight:ko.observable(0),
	availableanimations:ko.observableArray([]),
	optionsanimationname:ko.observable(""),
	selectedkeyframeblockname:ko.observable(""),
	keyframeblocknames:ko.observableArray([]),

	animations:{},
	
_emitError: function()
    {
        var errormap = {
            1:"Invalid animation width.",
            2:"Invalid animation height",
            3:"Invalid animation name",
            4:"Animation name alread exists",
            5:"No animations registered and chosen, cannot continue"
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
			if((!self.selectedanimationname) || (!self.selectedanimationname()))
			{
				self._emitError(5);
				return false;
			}
		}
	},
	initialize:function()
	{
		this.optionsanimationname.subscribe(this.optionsAnimationNameChanged,this);
		ko.applyBindings(this);
		$( "#tabs" ).on( "tabsbeforeactivate", this.beforeActivate );
	},
	optionsAnimationNameChanged: function(newvalue)
	{
		this.selectedanimationname(newvalue);
		var item = this.animations[newvalue];
		if(item)
		{
			this.selectedanimationwidth(item.width);
			this.selectedanimationheight(item.height);
		}
	},
	removeAnimationName: function()
	{
		var self = this;
		if(!self.selectedanimationname())
		{
			return;
		}
		if(self.selectedanimationname().length <= 0)
		{
			return;
		}
		if(self.animations[self.selectedanimationname()])
		{
			var  item = self.animations[self.selectedanimationname()];
			self.animationnames.remove(item.name);
			self.availableanimations.remove(item.name);
			if(item)
			{
				delete self.animations[item.name];
			}
		}
		if(self.animationnames().length > 0)
		{
			var item = self.animationnames()[0];
			self.optionsanimationname(item.name);
		}
		
	},
	addAnimationName: function()
	{
		var self = this;

		if(self.selectedanimationwidth() <= 0 || self.selectedanimationwidth() > self.MAX_ANIMATION_WIDTH)
		{
			self._emitError(1);
			return;
		}
		if(self.selectedanimationheight() <= 0 || self.selectedanimationheight() > self.MAX_ANIMATION_HEIGHT)
		{
			self._emitError(2);
			return;
		}

		if((!self.selectedanimationname()) || self.selectedanimationname().length <= 0)
		{
			self._emitError(3);
			return;
		}
		if(self.availableanimations().indexOf(self.selectedanimationname()) != -1)
		{
			self._emitError(4);
			return;
		}
		var animation = new Animation(self.selectedanimationname(),self.selectedanimationwidth(),self.selectedanimationheight());
		self.animations[self.selectedanimationname()] = animation;
		self.availableanimations.push(self.selectedanimationname());
		self.optionsanimationname(self.selectedanimationname());
		self.animationnames.push(self.selectedanimationname());

	}


};