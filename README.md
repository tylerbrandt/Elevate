# Elevator

A simple client-only elevator simulator, inspired by an interview question. The number of elevators, elevator speed, etc. is configurable (in source for now). To select the nearest elevator, the system calculates the cost of sending the elevator to that floor, taking into account its current queue (essentially, it simulates inserting the command into each elevator and compares which one will get there fastest).

Built on backbone.js

## Todo

* Allow user to change buliding size, elevator speed, etc. on the fly
* Support for "express" elevators that don't stop on every floor
* Unit tests for nearest elevator
* CSS/graphics
* Automatic enqueuing of commands at each stop (to simulate user pressing a button)