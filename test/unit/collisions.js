/** @file Tests for collision methods and how they report out.
 *
 * There are four 'collision' methods in p5.play:
 * - overlap (a check with no automatic response)
 * - displace (the caller pushes the callee out of the way)
 * - collide (the callee resists the caller, opposite of displace)
 * - bounce (motion of both callee and caller are affected)
 */
// The following jshint options stop it from complaining about chai expectations
/* jshint -W024 */
/* jshint expr:true */
/* global afterEach, beforeEach, describe, expect, it*/

describe('collisions', function() {
  var SIZE = 10;
  var pInst;
  var spriteA, spriteB, spriteC, spriteD;
  var groupAB, groupCD;
  var callCount, pairs;

  function testCallback(a, b) {
    callCount++;
    pairs.push([a.name, b.name]);
  }

  function moveAToB(a, b) {
    a.position.x = b.position.x;
  }

  beforeEach(function () {
    pInst = new p5(function() {});
    callCount = 0;
    pairs = [];

    function createTestSprite(letter, position) {
      var sprite = pInst.createSprite(position, 0, SIZE, SIZE);
      sprite.name = 'sprite' + letter;
      return sprite;
    }

    spriteA = createTestSprite('A', 2 * SIZE);
    spriteB = createTestSprite('B', 4 * SIZE);
    spriteC = createTestSprite('C', 6 * SIZE);
    spriteD = createTestSprite('D', 8 * SIZE);
    groupAB = new pInst.Group();
    groupAB.add(spriteA);
    groupAB.add(spriteB);
    groupCD = new pInst.Group();
    groupCD.add(spriteC);
    groupCD.add(spriteD);

    // Assert initial test state:
    // - Four sprites in two groups
    // - no two sprites overlap
    expect(pInst.allSprites.length).to.equal(4);
    expect(groupAB.length).to.equal(2);
    expect(groupCD.length).to.equal(2);
    pInst.allSprites.forEach(function (caller) {
      pInst.allSprites.forEach(function (callee) {
        expect(caller.overlap(callee)).to.be.false;
      });
    });
  });

  afterEach(function () {
    pInst.remove();
  });

  describe('sprite', function () {
    describe('overlap(sprite)', function () {
      it('false if sprites do not overlap', function () {
        expect(spriteA.overlap(spriteB)).to.be.false;
        expect(spriteB.overlap(spriteA)).to.be.false;
      });

      it('true if sprites overlap', function () {
        moveAToB(spriteA, spriteB);
        expect(spriteA.overlap(spriteB)).to.be.true;
        expect(spriteB.overlap(spriteA)).to.be.true;
      });

      it('calls callback once if sprites overlap', function () {
        moveAToB(spriteA, spriteB);
        expect(callCount).to.equal(0);
        spriteA.overlap(spriteB, testCallback);
        expect(callCount).to.equal(1);
        spriteB.overlap(spriteA, testCallback);
        expect(callCount).to.equal(2);
      });

      it('does not call callback if sprites do not overlap', function () {
        expect(callCount).to.equal(0);
        spriteA.overlap(spriteB, testCallback);
        expect(callCount).to.equal(0);
        spriteB.overlap(spriteA, testCallback);
        expect(callCount).to.equal(0);
      });

      describe('passes collider and collidee to callback', function () {
        it('A-B', function () {
          moveAToB(spriteA, spriteB);
          spriteA.overlap(spriteB, testCallback);
          expect(pairs).to.deep.equal([[spriteA.name, spriteB.name]]);
        });

        it('B-A', function () {
          moveAToB(spriteA, spriteB);
          spriteB.overlap(spriteA, testCallback);
          expect(pairs).to.deep.equal([[spriteB.name, spriteA.name]]);
        });
      });
    });

    describe('overlap(group)', function () {
      it('false if sprite does not overlap any sprites in group', function () {
        expect(spriteA.overlap(groupCD)).to.be.false;
      });

      it('does not check against sprites not in target group', function () {
        moveAToB(spriteA, spriteB);
        expect(spriteA.overlap(groupCD)).to.be.false;
      });

      it('does not care if sprites in target group overlap each other', function () {
        moveAToB(spriteC, spriteD);
        expect(spriteA.overlap(groupCD)).to.be.false;
      });

      it('true if sprite overlaps first sprite in group', function () {
        moveAToB(spriteA, spriteC);
        expect(spriteA.overlap(groupCD)).to.be.true;
      });

      it('true if sprite overlaps last sprite in group', function () {
        moveAToB(spriteA, spriteD);
        expect(spriteA.overlap(groupCD)).to.be.true;
      });

      it('true if sprite overlaps every sprite in group', function () {
        moveAToB(spriteC, spriteA);
        moveAToB(spriteD, spriteA);
        expect(spriteA.overlap(groupCD)).to.be.true;
      });

      it('does not overlap self when checking own group', function () {
        expect(spriteA.overlap(groupAB)).to.be.false;
      });

      it('can overlap with other sprites in own group', function () {
        moveAToB(spriteA, spriteB);
        expect(spriteA.overlap(groupAB)).to.be.true;
      });

      it('does not call callback when not overlapping any sprites', function () {
        spriteA.overlap(groupCD, testCallback);
        expect(callCount).to.equal(0);
      });

      it('calls callback once when overlapping one sprite', function () {
        moveAToB(spriteC, spriteA);
        spriteA.overlap(groupCD, testCallback);
        expect(callCount).to.equal(1);
      });

      it('calls callback twice when overlapping two sprites', function () {
        moveAToB(spriteC, spriteA);
        moveAToB(spriteD, spriteA);
        spriteA.overlap(groupCD, testCallback);
        expect(callCount).to.equal(2);
      });

      describe('passes collider and collidee to callback', function () {
        it('A-C', function () {
          moveAToB(spriteA, spriteC);
          spriteA.overlap(groupCD, testCallback);
          expect(pairs).to.deep.equal([[spriteA.name, spriteC.name]]);
        });

        it('A-D', function () {
          moveAToB(spriteA, spriteD);
          spriteA.overlap(groupCD, testCallback);
          expect(pairs).to.deep.equal([[spriteA.name, spriteD.name]]);
        });

        it('A-C-D', function () {
          moveAToB(spriteC, spriteA);
          moveAToB(spriteD, spriteA);
          spriteA.overlap(groupCD, testCallback);
          expect(pairs).to.deep.equal([
            [spriteA.name, spriteC.name],
            [spriteA.name, spriteD.name]]);
        });
      });
    });

    describe('displace(sprite)', function () {
      it('false if sprites do not overlap', function () {
        expect(spriteA.displace(spriteB)).to.be.false;
        expect(spriteB.displace(spriteA)).to.be.false;
      });

      it('true if sprites overlap', function () {
        moveAToB(spriteA, spriteB);
        expect(spriteA.displace(spriteB)).to.be.true;

        moveAToB(spriteA, spriteB);
        expect(spriteB.displace(spriteA)).to.be.true;
      });

      it('calls callback once if sprites overlap', function () {
        expect(callCount).to.equal(0);

        moveAToB(spriteA, spriteB);
        spriteA.displace(spriteB, testCallback);
        expect(callCount).to.equal(1);

        moveAToB(spriteA, spriteB);
        spriteB.displace(spriteA, testCallback);
        expect(callCount).to.equal(2);
      });

      it('does not call callback if sprites do not overlap', function () {
        expect(callCount).to.equal(0);
        spriteA.displace(spriteB, testCallback);
        expect(callCount).to.equal(0);
        spriteB.displace(spriteA, testCallback);
        expect(callCount).to.equal(0);
      });

      describe('passes collider and collidee to callback', function () {
        it('A-B', function () {
          moveAToB(spriteA, spriteB);
          spriteA.displace(spriteB, testCallback);
          expect(pairs).to.deep.equal([[spriteA.name, spriteB.name]]);
        });

        it('B-A', function () {
          moveAToB(spriteA, spriteB);
          spriteB.displace(spriteA, testCallback);
          expect(pairs).to.deep.equal([[spriteB.name, spriteA.name]]);
        });
      });
    });

    describe('displace(group)', function () {
      it('false if sprite does not overlap any sprites in group', function () {
        expect(spriteA.displace(groupCD)).to.be.false;
      });

      it('does not check against sprites not in target group', function () {
        moveAToB(spriteA, spriteB);
        expect(spriteA.displace(groupCD)).to.be.false;
      });

      it('does not care if sprites in target group overlap each other', function () {
        moveAToB(spriteC, spriteD);
        expect(spriteA.displace(groupCD)).to.be.false;
      });

      it('true if sprite overlaps first sprite in group', function () {
        moveAToB(spriteA, spriteC);
        expect(spriteA.displace(groupCD)).to.be.true;
      });

      it('true if sprite overlaps last sprite in group', function () {
        moveAToB(spriteA, spriteD);
        expect(spriteA.displace(groupCD)).to.be.true;
      });

      it('true if sprite overlaps every sprite in group', function () {
        moveAToB(spriteC, spriteA);
        moveAToB(spriteD, spriteA);
        expect(spriteA.displace(groupCD)).to.be.true;
      });

      it('does not overlap self when checking own group', function () {
        expect(spriteA.displace(groupAB)).to.be.false;
      });

      it('can overlap with other sprites in own group', function () {
        moveAToB(spriteA, spriteB);
        expect(spriteA.displace(groupAB)).to.be.true;
      });

      it('does not call callback when not overlapping any sprites', function () {
        spriteA.displace(groupCD, testCallback);
        expect(callCount).to.equal(0);
      });

      it('calls callback once when overlapping one sprite', function () {
        moveAToB(spriteC, spriteA);
        spriteA.displace(groupCD, testCallback);
        expect(callCount).to.equal(1);
      });

      it('calls callback twice when overlapping two sprites', function () {
        moveAToB(spriteC, spriteA);
        moveAToB(spriteD, spriteA);
        spriteA.displace(groupCD, testCallback);
        expect(callCount).to.equal(2);
      });

      describe('passes collider and collidee to callback', function () {
        it('A-C', function () {
          moveAToB(spriteA, spriteC);
          spriteA.displace(groupCD, testCallback);
          expect(pairs).to.deep.equal([[spriteA.name, spriteC.name]]);
        });

        it('A-D', function () {
          moveAToB(spriteA, spriteD);
          spriteA.displace(groupCD, testCallback);
          expect(pairs).to.deep.equal([[spriteA.name, spriteD.name]]);
        });

        it('A-C-D', function () {
          moveAToB(spriteC, spriteA);
          moveAToB(spriteD, spriteA);
          spriteA.displace(groupCD, testCallback);
          expect(pairs).to.deep.equal([
            [spriteA.name, spriteC.name],
            [spriteA.name, spriteD.name]]);
        });
      });
    });
  });

  describe('group', function () {
    describe('overlap(sprite)', function () {
      it('false if no sprites overlap', function () {
        expect(groupAB.overlap(spriteC)).to.be.false;
      });

      it('false if no sprite in group overlaps target sprite', function () {
        moveAToB(spriteA, spriteB);
        expect(groupAB.overlap(spriteC)).to.be.false;
      });

      it('true if all sprites in group overlap target sprite', function () {
        moveAToB(spriteA, spriteC);
        moveAToB(spriteB, spriteC);
        expect(groupAB.overlap(spriteC)).to.be.true;
      });

      describe('true if any sprites in group overlap target sprite', function () {
        it('A overlaps C', function () {
          moveAToB(spriteA, spriteC);
          expect(groupAB.overlap(spriteC)).to.be.true;
        });

        it('B overlaps C', function () {
          moveAToB(spriteB, spriteC);
          expect(groupAB.overlap(spriteC)).to.be.true;
        });
      });

      it('does not call callback when not overlapping sprite', function () {
        groupAB.overlap(spriteC, testCallback);
        expect(callCount).to.equal(0);
      });

      describe('passes collider and collidee to callback for each overlap', function () {
        it('A-C', function () {
          moveAToB(spriteA, spriteC);
          groupAB.overlap(spriteC, testCallback);
          expect(pairs).to.deep.equal([[spriteA.name, spriteC.name]]);
        });

        it('B-C', function () {
          moveAToB(spriteB, spriteC);
          groupAB.overlap(spriteC, testCallback);
          expect(pairs).to.deep.equal([[spriteB.name, spriteC.name]]);
        });

        it('A-B-C', function () {
          moveAToB(spriteA, spriteC);
          moveAToB(spriteB, spriteC);
          groupAB.overlap(spriteC, testCallback);
          expect(pairs).to.deep.equal([
            [spriteA.name, spriteC.name],
            [spriteB.name, spriteC.name]]);
        });
      });
    });

    describe('overlap(group)', function () {
      function expectGroupsOverlap(outcome) {
        expect(groupAB.overlap(groupCD)).to.equal(outcome);
        expect(groupCD.overlap(groupAB)).to.equal(outcome);
      }

      it('false if no sprites overlap', function () {
        expectGroupsOverlap(false);
      });

      it('false if no sprite in group AB overlaps any sprite in group CD', function () {
        moveAToB(spriteA, spriteB);
        moveAToB(spriteC, spriteD);
        expectGroupsOverlap(false);
      });

      it('true if all sprites in group AB overlap all sprites in group CD', function () {
        moveAToB(spriteB, spriteA);
        moveAToB(spriteC, spriteA);
        moveAToB(spriteD, spriteA);
        expectGroupsOverlap(true);
      });

      describe('true if any sprites in group AB overlap any sprites in group CD', function () {
        it('A overlaps C', function () {
          moveAToB(spriteA, spriteC);
          expectGroupsOverlap(true);
        });

        it('A overlaps D', function () {
          moveAToB(spriteA, spriteD);
          expectGroupsOverlap(true);
        });

        it('B overlaps C', function () {
          moveAToB(spriteB, spriteC);
          expectGroupsOverlap(true);
        });

        it('B overlaps D', function () {
          moveAToB(spriteB, spriteD);
          expectGroupsOverlap(true);
        });
      });

      it('group does not overlap self if no sprites within group overlap', function () {
        expect(groupAB.overlap(groupAB)).to.be.false;
      });

      it('group overlaps self if two different sprites within group overlap', function () {
        moveAToB(spriteA, spriteB);
        expect(groupAB.overlap(groupAB)).to.be.true;
      });

      it('does not call callback when not overlapping any sprites', function () {
        groupAB.overlap(groupCD, testCallback);
        expect(callCount).to.equal(0);
      });

      describe('passes collider and collidee to callback for each pair', function () {
        it('A-C', function () {
          moveAToB(spriteA, spriteC);
          groupAB.overlap(groupCD, testCallback);
          expect(pairs).to.deep.equal([[spriteA.name, spriteC.name]]);
        });

        it('A-D', function () {
          moveAToB(spriteA, spriteD);
          groupAB.overlap(groupCD, testCallback);
          expect(pairs).to.deep.equal([[spriteA.name, spriteD.name]]);
        });

        it('B-C', function () {
          moveAToB(spriteB, spriteC);
          groupAB.overlap(groupCD, testCallback);
          expect(pairs).to.deep.equal([[spriteB.name, spriteC.name]]);
        });

        it('B-D', function () {
          moveAToB(spriteB, spriteD);
          groupAB.overlap(groupCD, testCallback);
          expect(pairs).to.deep.equal([[spriteB.name, spriteD.name]]);
        });

        it('A-B-C', function () {
          moveAToB(spriteB, spriteA);
          moveAToB(spriteC, spriteA);
          groupAB.overlap(groupCD, testCallback);
          expect(pairs).to.deep.equal([
            [spriteA.name, spriteC.name],
            [spriteB.name, spriteC.name]]);
        });

        it('A-B-D', function () {
          moveAToB(spriteB, spriteA);
          moveAToB(spriteD, spriteA);
          groupAB.overlap(groupCD, testCallback);
          expect(pairs).to.deep.equal([
            [spriteA.name, spriteD.name],
            [spriteB.name, spriteD.name]]);
        });

        it('A-C-D', function () {
          moveAToB(spriteC, spriteA);
          moveAToB(spriteD, spriteA);
          groupAB.overlap(groupCD, testCallback);
          expect(pairs).to.deep.equal([
            [spriteA.name, spriteC.name],
            [spriteA.name, spriteD.name]]);
        });

        it('B-C-D', function () {
          moveAToB(spriteC, spriteB);
          moveAToB(spriteD, spriteB);
          groupAB.overlap(groupCD, testCallback);
          expect(pairs).to.deep.equal([
            [spriteB.name, spriteC.name],
            [spriteB.name, spriteD.name]]);
        });

        it('A-C, B-D', function () {
          moveAToB(spriteC, spriteA);
          moveAToB(spriteD, spriteB);
          groupAB.overlap(groupCD, testCallback);
          expect(pairs).to.deep.equal([
            [spriteA.name, spriteC.name],
            [spriteB.name, spriteD.name]]);
        });

        it('A-D, B-C', function () {
          moveAToB(spriteC, spriteB);
          moveAToB(spriteD, spriteA);
          groupAB.overlap(groupCD, testCallback);
          expect(pairs).to.deep.equal([
            [spriteA.name, spriteD.name],
            [spriteB.name, spriteC.name]]);
        });

        it('A-B-C-D', function () {
          moveAToB(spriteB, spriteA);
          moveAToB(spriteC, spriteA);
          moveAToB(spriteD, spriteA);
          groupAB.overlap(groupCD, testCallback);
          expect(pairs).to.deep.equal([
            [spriteA.name, spriteC.name],
            [spriteA.name, spriteD.name],
            [spriteB.name, spriteC.name],
            [spriteB.name, spriteD.name]]);
        });
      });
    });
  });
});
