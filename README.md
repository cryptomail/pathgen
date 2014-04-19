###Pathgen -- Create, save, and play  paths mit der maus 
######(Disclaimer, I don't speak German)

###I want you to be able to:
1. create a canvas viewport
2. rubber band path points
3. delete a path point
4. modify x/y of a path point
4. select a path point and change its final orientation
5. select two adjascent path points and change the time it takes to pass between them
6. set global defaults for path points like changing the time it takes to pass between them, and orientation
7. set img/sprite for running the simulation
8. run simulation
9. output to JSON for saving


###Todo:
1. ~~implement rubber banding [ 03/09/2014 wait didn't I just do that! \o/ yay]~~
2. ~~consider using mvvm for stuff [ 3/14/2014 oh yeah baby...sorry @briantford went with the supercharged water scooter but I still love your work :) ]~~
3. ~~JSON editor for input/output [done 3/30/2014]~~
4. ~~resize [done 3/14/2014 YAY PI DAY]~~
5. ~~put in object model (see 2) [ 03/09/2014 now have better encapsulated js objects ]~~
6. ~~delete points [done 3/15/2014]~~
7. ~~put segments in list [done 3/16/2014]~~
8. ~~need to have panel for interval between points (on segments)  [done 3/17/2014]~~
9. ~~Present user with rotation panel when they click on point.~~
10. ~~Begin simulation runner [started 3/28.2014]~~
11. Start building the app
12. ~~Added sprite for the path simulator object [done 3/30/2014]~~
13. ~~Need to describe size of sprite in simulator~~
14. ~~Added versioning to path info [done 3/30/2014]~~
15. Think about animation patterns and design.
16. start painting with sized rects and not DOTS so content creators know spacing better
17. Allow for more than one path at a time.


###Notes on adding multiple paths:
There will be a root path when none are introduced.
Then, when a user introduces a path, it will be the root path.
It will last for a delta T.

It may not be the longest in the upcoming series, but it will exist as the root.
Then, the user will either be in simulation mode or addpath mode.
We're going to change this and make it like a looper in the music world :)

###States:
####Blank slate:

User is ready to draw their first path.  User draws their first path and we have the root node.

The app then goes into playback mode.
####Additive Loop:
The root path is playing.  The user may riff on top of the existing path by generating a path in a child node of the parent.
When the mouse is down, the time and locationof when the root path is displaced is marked, and the child path is recorded.  Then,
on mouseup, that path is added to the root path.

Should there be sibling paths to the root, or child paths?  What are the trade offs?

Sibling root paths vs chaining...

One detriment of having sibling root paths is that the offset of WHEN to start will have to be made obvious by a
temporal offset.  However, when a path is CHAINED to another path, then when to start is implicit by the player.
When the player encounters another node, it can easily just surmise when to begin another path to raster!




