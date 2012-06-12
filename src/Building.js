var Floor = Backbone.Model.extend();

var FloorList = Backbone.Collection.extend({
	model: Floor,
	comparator: function(a,b) {
		return b.get('floorNumber') - a.get('floorNumber');
	}
});

var FloorView = Backbone.View.extend({
	tagName: 'li',
	template: _.template($("#floor-template").html()),
	events: {
		'click .up': 'up',
		'click .down': 'down'
	},
	render: function() {
		var modelData = this.model.toJSON();
		var templateString = this.template(modelData);
		this.$el.html(templateString);
		return this;
	},

	up: function() {
		this.model.get('building').trigger('UP', this.model.get('floorNumber'));
	},

	down: function() {
		this.model.get('building').trigger('DOWN', this.model.get('floorNumber'));
	}
});

var Building = Backbone.Model.extend({
	defaults: function() {
		return {
			numFloors: 15,
			numElevators: 3,
			totalTravelTime: 0,
			totalDeliveries: 0,
			travelAverage: 0
		};
	},

	initialize: function() {
		this.Floors = new FloorList;
		this.addFloors(this.get('numFloors'));

		this.Elevators = new ElevatorList();
		_(this.get('numElevators')).times(function(i) {
			this.Elevators.add(new Elevator({ 
				elevatorNumber: i,
				topFloor: this.get('numFloors'),
				building: this
			}));
		}, this);

		this.on('all', function(ev, floor) {
			var nearestElevator;
			if (ev in Elevator.DIRECTION) {

				nearestElevator = this.nearestElevator(ev, floor);
				//if(nearestElevator !== null) {
				$('#queue').append(_.template($("#log-entry").html(), { 
					command: { floor: floor, direction: ev },
					ev: nearestElevator.ev,
					cost: nearestElevator.cost 
				}));
				nearestElevator.ev.trigger(ev, floor);	
				//}
				
			}
		});

	},

	addFloors: function(numFloors) {
		for(var i = 0; i < numFloors; i++) {
			this.addFloor(i+1, numFloors);
		}
	},
	addFloor: function(floorNumber, numFloors) {
		var floorData = {
			'floorNumber': floorNumber,
			'building': this
		}, floor, floorView;
		
		if(floorNumber == numFloors) {
			floorData.top = true;
		}

		floor = new Floor(floorData);
		this.Floors.add(floor);
	},

	nearestElevator: function(ev, floor) {
		var nearest = null, cost, bestCost;

		//console.log("Computing cost for " + ev + ":", floor);

		this.Elevators.each(function(elevator) {
			cost = elevator.selectQueuePosition({
				floor: floor,
				direction: Elevator.DIRECTION[ev]
			}, true);

			//console.log(cost);

			if(nearest === null || cost < bestCost) {
				nearest = elevator;
				bestCost = cost;
			}
		});

		return { ev: nearest, cost: bestCost };
	},

	updateStats: function(data) {
		//console.log(data);	
		var travelTime = data.travelTime || 0,
			deliveries = data.deliveries || 0,
			totalTravelTime = this.get('totalTravelTime') + travelTime,
			totalDeliveries = this.get('totalDeliveries') + deliveries,
			travelAverage = totalDeliveries === 0 ? totalTravelTime : totalTravelTime / totalDeliveries;
		this.set({
			totalTravelTime: totalTravelTime,
			totalDeliveries: totalDeliveries,
			travelAverage: travelAverage
		});
	}
});

var BuildingView = Backbone.View.extend({
	el: $('#building'),
	statsTemplate: _.template($("#stats-template").html()),

	initialize: function() {
		this.model = new Building;
		this.addFloors();
		this.addElevators();

		this.model.on('elevator:update', this.updateStats, this);
	},
	addFloors: function() {
		this.model.Floors.each(function(floor) {
			floorView = new FloorView({model: floor});
			this.$el.find('#floors').append(floorView.render().el);
		}, this);
	},

	addElevators: function() {
		this.model.Elevators.each(function(elevator) {
			elevatorView = new ElevatorView({model: elevator});
			this.$el.find('#elevators').append(elevatorView.render().el);
		}, this);
	},

	updateStats: function(data) {
		this.model.updateStats(data);
		$("#stats").html(this.statsTemplate(this.model.toJSON()));
		return this;
	}
});

var building = new BuildingView;