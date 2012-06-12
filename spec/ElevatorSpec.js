describe("Elevator", function() {
	var elevator;

	beforeEach(function(){
		elevator = new Elevator();
	});

	it("should begin at level 1", function() {
		expect(elevator.get("floor")).toEqual(1);
	});

	describe("#enqueue", function() {
		var command1up, command2up, command3up, command3down, command2down, command3down, command4down, queue;

		beforeEach(function() {
			command1up = { floor: 1, direction: Elevator.DIRECTION.UP };
			command2up = { floor: 2, direction: Elevator.DIRECTION.UP };
			command3up = { floor: 3, direction: Elevator.DIRECTION.UP };
			command3down = { floor: 3, direction: Elevator.DIRECTION.DOWN };
			command2down = { floor: 2, direction: Elevator.DIRECTION.DOWN };
			command3down = { floor: 3, direction: Elevator.DIRECTION.DOWN };
			command4down = { floor: 4, direction: Elevator.DIRECTION.DOWN };
		})

		it("should take a floor command", function() {
			var command = command1up;
			elevator.enqueue(command);

			expect(elevator.get("queue").length).toEqual(1);
			expect(elevator.get("queue")[0]).toEqual(command);
		});

		it("should process multiple commands", function() {
			elevator.enqueue(command1up);
			elevator.enqueue(command2up);
			expect(elevator.get("queue").length).toEqual(2);
			expect(elevator.get("queue")[0]).toEqual(command1up);
			expect(elevator.get("queue")[1]).toEqual(command2up);
		});

		describe("when commands received in the UP direction", function() {
			it("should sort them by floor ASCENDING (1,2)", function() {
				elevator.enqueue(command2up);
				elevator.enqueue(command1up);
				expect(elevator.get("queue").length).toEqual(2);
				expect(elevator.get("queue")[0]).toEqual(command1up);
				expect(elevator.get("queue")[1]).toEqual(command2up);
			});

			it("should handle 3 commands at once (1,2,3)", function() {
				elevator.enqueue(command2up);
				elevator.enqueue(command1up);
				elevator.enqueue(command3up);
				queue = elevator.get("queue");

				expect(queue.length).toEqual(3);
				expect(queue[0]).toEqual(command1up);
				expect(queue[1]).toEqual(command2up);
				expect(queue[2]).toEqual(command3up);
			});

		});

		describe("when commands received in the DOWN direction", function() {


			it("should sort them by floor DESCENDING (3,2)", function() {
				elevator.enqueue(command2down);
				elevator.enqueue(command3down);
				expect(elevator.get("queue").length).toEqual(2);
				expect(elevator.get("queue")[0]).toEqual(command3down);
				expect(elevator.get("queue")[1]).toEqual(command2down);
			});

			it("should handle 3 commands at once (4,3,2)", function() {
				elevator.enqueue(command3down);
				elevator.enqueue(command4down);
				elevator.enqueue(command2down);
				queue = elevator.get("queue");

				expect(queue.length).toEqual(3);
				expect(queue[0]).toEqual(command4down);
				expect(queue[1]).toEqual(command3down);
				expect(queue[2]).toEqual(command2down);
			});

		});

		describe("when commands for both UP and DOWN received", function() {
			describe("when UP command received first", function() {
				beforeEach(function() {
					elevator.enqueue(command1up);
				});

				it("should sort UP commands before DOWN commands", function() {

					elevator.enqueue(command4down);
					elevator.enqueue(command3up);
					queue = elevator.get("queue");
					console.log(queue);

					expect(queue.length).toEqual(3);
					expect(queue[0]).toEqual(command1up);
					expect(queue[1]).toEqual(command3up);
					expect(queue[2]).toEqual(command4down);
				});

				it("should sort 4 interleaved commands into UP then DOWN", function() {
					elevator.enqueue(command2down);
					elevator.enqueue(command3up);
					elevator.enqueue(command4down);
					queue = elevator.get("queue");

					expect(queue.length).toEqual(4);
					expect(queue[0]).toEqual(command1up);
					expect(queue[1]).toEqual(command3up);
					expect(queue[2]).toEqual(command4down);
					expect(queue[3]).toEqual(command2down);
				});
			});

			describe("when DOWN command received first", function() {
				beforeEach(function() {
					elevator.enqueue(command2down);
				});

				it("should sort DOWN commands before UP commands", function() {

					elevator.enqueue(command3up);
					elevator.enqueue(command4down);
					queue = elevator.get("queue");
					console.log(queue);

					expect(queue.length).toEqual(3);
					expect(queue[0]).toEqual(command4down);
					expect(queue[1]).toEqual(command2down);
					expect(queue[2]).toEqual(command3up);
				});

				it("should sort 4 interleaved commands into DOWN then UP", function() {
					elevator.enqueue(command3up);
					elevator.enqueue(command4down);
					elevator.enqueue(command1up);
					queue = elevator.get("queue");

					expect(queue.length).toEqual(4);
					expect(queue[0]).toEqual(command4down);
					expect(queue[1]).toEqual(command2down);
					expect(queue[2]).toEqual(command1up);
					expect(queue[3]).toEqual(command3up);
				});
			});
		});
	});
});