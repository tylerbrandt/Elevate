var Elevator = Backbone.Model.extend({

	defaults: function() {
		return {
			floor: 1,
			queue: [],
			state: Elevator.STATE.IDLE,
			// ms to travel one floor
			timeout: 2000,
			// ms to load/unload passengers
			loadTime: 5000
		};
	},

	initialize: function() {
		// initialize some analytics
		this.set({
			travelTime: 0,
			deliveries: 0,
			direction: Elevator.DIRECTION.NONE,
			loading: false	
		});

		this.on('all', function(ev, floor) {
			if(ev in Elevator.DIRECTION) {
				this.enqueue({
					floor: floor,
					direction: Elevator.DIRECTION[ev]
				});
			}
		});
	},

	enqueue: function(command) {
		var q, qpos;
		
		qpos = this.selectQueuePosition(command).pos;

		if(qpos !== -1) {
			q = this.get("queue");
			q.splice(qpos, 0, command);
		}
		
		this.set("queue", q);
		this.trigger('change');

		if(this.get('state') === Elevator.STATE.IDLE) {
			this.start();
		}
	},

	// this function also used to calculate cost of inserting
	selectQueuePosition: function(command) {
		var i, q = this.get('queue'), 
			timePerFloor = this.get('timeout'), lastFloor = this.get('floor'),
			travelTime = 0;
		for (i = 0; i < q.length; i++) {
			if (q[i].direction !== command.direction) {
				travelTime += timePerFloor * Math.abs(q[i].floor - lastFloor);
				lastFloor = q[i].floor;
				continue;
			}
			if (command.direction === Elevator.DIRECTION.UP && command.floor > q[i].floor) {
				travelTime += timePerFloor * Math.abs(q[i].floor - lastFloor);
				lastFloor = q[i].floor;
				continue;
			} else if (command.direction === Elevator.DIRECTION.DOWN && command.floor < q[i].floor) {
				travelTime += timePerFloor * Math.abs(q[i].floor - lastFloor);
				lastFloor = q[i].floor;
				continue;
			}
			if(command.floor === q[i].floor) {
				// no need to duplicate commands
				return { pos: -1, cost: 0 };
			}
			break;
		}

		travelTime += timePerFloor * Math.abs(command.floor - lastFloor);

		// cost is # of stops + travelTime
		cost = i * this.get('loadTime') + travelTime;
		return { pos: i, cost: cost };
	},

	start: function() {
		this.set({ 
			state: Elevator.STATE.RUNNING
		});
		this.update();
	},

	stop: function() {
		this.set({
			state: Elevator.STATE.IDLE,
			direction: Elevator.DIRECTION.NONE,
			loading: false
		});
	},

	pause: function() {
		this.set({ 
			state: Elevator.STATE.PAUSED
		});
	},

	// Call update once per floor traveled
	update: function() {
		var s = this.get("state"), 
			q = this.get("queue"), 
			destination, 
			floor = this.get("floor"),
			timeout = this.get('timeout'),
			deliveries = this.get('deliveries'),
			travelTime = this.get('travelTime'),
			direction = this.get('direction'),
			floorRange, destFloor;
		if(s === Elevator.STATE.RUNNING) {
			if(this.get('loading') === true) {
				// spawn a random command (somebody pushed a button)

				/*
				if (direction === Elevator.DIRECTION.UP && floor <= this.get('topFloor') - 1) {
					floorRange = this.get('topFloor') - floor - 1;
					destFloor = Math.floor(Math.random() * floorRange) + floor + 1;
					this.enqueue({
						floor: destFloor,
						direction: direction
					});
					
				} else if(direction === Elevator.DIRECTION.DOWN && floor > 1) {
					floorRange = floor - 1;
					destFloor = Math.floor(Math.random() * floorRange) + 1;
					this.enqueue({
						floor: destFloor,
						direction: direction
					});
				}
				*/

				this.set({
					loading: false
				});

				
				
				timeout = this.get('loadTime');
			} else if(q.length == 0) {
				this.stop();
			} else {
				destination = q[0];
				
				direction = Elevator.DIRECTION.NONE;
				if(floor < destination.floor) {
					floor = floor + 1;
					direction = Elevator.DIRECTION.UP;
				} else {
					floor = floor - 1;
					direction = Elevator.DIRECTION.DOWN;
				}
				
				this.set({
					floor: floor,
					direction: direction
				});

				if(floor == destination.floor) {
					// reached destination
					q.shift();
					this.set({ 
						queue: q, 
						deliveries: deliveries+1,
						loading: true
					});

					
				}
			
			}

			//console.log("Increasing travel time by ", timeout);
			this.set({
				travelTime: travelTime + timeout
			});
			setTimeout(this.recall(), timeout);
			
		} else if(q.length > 0) {
			this.start();
			setTimeout(this.recall(), timeout);
		}
	},

	recall: function() {
		var me = this;
		return function() {
			me.update();
		};
	}
});

var ElevatorList = Backbone.Collection.extend({
	model: Elevator
});

// Enumerate the states of an elevator
Elevator.STATE = {
	IDLE: "IDLE", // no commands, elevator paused
	RUNNING: "RUNNING", // elevator traveling to next command
	PAUSED: "PAUSED" // elevator has commands but is not running
};

Elevator.DIRECTION = {
	UP: "UP",
	DOWN: "DOWN",
	NONE: "NONE"
};

var ElevatorView = Backbone.View.extend({
	className: "elevator",
	tagName: "li",
	
	template: _.template($("#elevator-template").html()),
	indicatorTemplate: _.template($("#elevator-indicator-template").html()),

	initialize: function() {
		this.model.on('change', this.render, this);
	},

	render: function() {
		var modelData = this.model.toJSON(), indicatorHTML;
		modelData.cid = this.model.cid;
		this.$el.html(this.template({ modelData: modelData }));

		// add an indicator to the floors list
		$("#elevator_" + this.model.cid).remove();
		indicatorHTML = $(this.indicatorTemplate(modelData));
		indicatorHTML.appendTo(".floor." + this.model.get('floor') + " .elevators").css({
			left: this.model.get('elevatorNumber') * 40 + 'px'
		});

		return this;
	}
});