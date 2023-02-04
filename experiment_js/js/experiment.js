var touchstone = 2;

var state = {
  NONE:0,
  INSTRUCTIONS: 1,
  SHAPES: 2,
  PLACEHOLDERS: 3,
};

var ctx = {
  w: 800,
  h: 600,

  trials: [],
  participant: "",
  startBlock: 1,
  startTrial: 1,
  cpt: 1,
  currentSearchTime: 0,
  errorCount:0,

  participantIndex:touchstone == 1 ? "Participant" : "ParticipantID",
  practiceIndex:"Practice",
  blockIndex: (touchstone == 1 ? "Block" : "Block1"),
  trialIndex: (touchstone == 1 ? "Trial" : "Block2"),
  vvIndex:"VV",
  objectsCountIndex:"OC",

  state:state.NONE,
  targetIndex:0,

  // TODO log measures
  // loggedTrials is a 2-dimensional array where we store our log file
  // where one line is one trial
  loggedTrials:
    touchstone == 1 ?
    [["Participant","Practice","Block","Trial","VV","OC","visualSearchTime","ErrorCount"]] :
    [["DesignName","ParticipantID","TrialID","Block1","Block2","VV","OC","visualSearchTime","ErrorCount"]]
};

/****************************************/
/********** LOAD CSV DESIGN FILE ********/
/****************************************/

var loadData = function(svgEl){
  // d3.csv parses a csv file...
  //d3.csv("experiment_touchstone"+touchstone+".csv")
  d3.csv("preattentive_variables"+touchstone+".csv").then(function(data){
    // ... and turns it into a 2-dimensional array where each line is an array indexed by the column headers
    // for example, data[2]["OC"] returns the value of OC in the 3rd line
    ctx.trials = data;
    // all trials for the whole experiment are stored in global variable ctx.trials
    console.log(data);
    var participant = "";
    var options = [];

    for(var i = 0; i < ctx.trials.length; i++) {
      if(!(ctx.trials[i][ctx.participantIndex] === participant)) {
        participant = ctx.trials[i][ctx.participantIndex];
        options.push(participant);
      }
    }
    var select = d3.select("#participantSel")
    select.selectAll("option")
      .data(options)
      .enter()
      .append("option")
      .text(function (d) { return d; });

    setParticipant(options[0]);

  }).catch(function(error){console.log(error)});
};

/****************************************/
/************* RUN EXPERIMENT ***********/
/****************************************/


var startExperiment = function(event) {
  event.preventDefault();

  d3.select("#shapes").remove();
  d3.select("#placeholders").remove();
  d3.select("#instructions").remove();

  // set the trial counter to the first trial to run
  // ctx.participant, ctx.startBlock and ctx.startTrial contain values selected in combo boxes
  console.log("Before start process");
  for(var i = 0; i < ctx.trials.length; i++) {
    if(ctx.trials[i][ctx.participantIndex] === ctx.participant) {
      if(parseInt(ctx.trials[i][ctx.blockIndex]) == ctx.startBlock
               && (touchstone == 2 || ctx.trials[i][ctx.practiceIndex].toLowerCase() === "false")) {
        if(parseInt(ctx.trials[i][ctx.trialIndex]) == ctx.startTrial) {
          console.log("trial found");

          ctx.cpt = i - 1;

          if(touchstone == 1) { // include practice trials before this trial for TouchStone 1
            while(ctx.cpt >= 0 && ctx.trials[ctx.cpt][ctx.practiceIndex].toLowerCase() === "true") {
              ctx.cpt = ctx.cpt-1;
            }
          }

          // start first trial
          console.log("start experiment at "+ctx.cpt);
          nextTrial();
          return;
        }
      }
    }
  }
}

var nextBlock = function(){
  ctx.cpt=ctx.startTrial;
  console.log(ctx.cpt);
  d3.select("#shapes").remove();
  d3.select("#placeholders").remove();
  d3.select("#instructions").remove();
  selectValue = d3.select("#blockSel").property("value");
  if(selectValue==3){
    setParticipant(cpt.participant+1);
    //could set new participant here
    return;
  }
  setBlock(selectValue+1);
}

var nextTrial = function() {
  ctx.currentSearchTime=0;
  ctx.errorCount=0;
  ctx.cpt++;
  if( ctx.cpt>ctx.trials.length){
    nextBlock();
  }
  selectValue = d3.select("#trialSel").property("value");
  setTrial(selectValue+1);
  displayInstructions();
}

var displayParticipantChange = function(){
  ctx.state = state.NONE;
  let participantMessage="Participant "+ctx.participant;
  d3.select("#instructionsCanvas")
    .append("div")
    .attr("id", "instructions")
    .classed("instr", true);
    
  d3.select("#instructions")
    .append("p")
    .html(participantMessage);
  
    d3.select("#instructions")
    .append("p")
    .html("Press GO when ready to start.");

}

var displayInstructions = function() {
  ctx.state = state.INSTRUCTIONS;
  let trialProgress="Trial "+ctx.trials[ctx.cpt][ctx.trialIndex]+"/15";
  d3.select("#instructionsCanvas")
    .append("div")
    .attr("id", "instructions")
    .classed("instr", true);
    
  d3.select("#instructions")
    .append("p")
    .html(trialProgress);

  d3.select("#instructions")
    .append("p")
    .html("Multiple shapes will get displayed.<br> Only <b>one shape</b> is different from all other shapes.");

  d3.select("#instructions")
    .append("p")
    .html("1. Spot it as fast as possible and press <code>Space</code> bar;");

  d3.select("#instructions")
    .append("p")
    .html("2. Click on the placeholder over that shape.");

  d3.select("#instructions")
    .append("p")
    .html("Press <code>Enter</code> key when ready to start.");

}

const shadowIntensity = [0,0.5];
const motionShift= [0,10];

var displayShapes = function() {
  ctx.state = state.SHAPES;
  var shadowIndex =1;
  var motionIndex =1;
  

  var visualVariable = ctx.trials[ctx.cpt]["VV"];
  // console.log(visualVariable);
  var oc = ctx.trials[ctx.cpt]["OC"];
  console.log(oc);
  if(oc === "Low") {
    objectCount = 9;
  } else if(oc === "Medium") {
    objectCount = 25;
  } else {
    objectCount = 49;
  }
  console.log("display shapes for condition "+oc+","+visualVariable);

  var svgElement = d3.select("svg");



  var group = svgElement.append("g")
  .attr("id", "shapes")
  .attr("transform", "translate(100,100)");

  // 1. Decide on the visual appearance of the target
  // In my example, it means deciding on its size (large or small) and its color (light or dark)
  var randomNumber1 = Math.random();
  var randomNumber2 = Math.random();
  var targetSize, targetColor, targetShadow, targetMotion, tmpShadow, tmpMotion;
  if(randomNumber1 > 0.5) {
    targetSize = 25; // target is large
  } else {
    targetSize = 15; // target is small
  }
  if(randomNumber2 > 0.5) {
    targetColor = "DarkGray"; // target is dark gray
  } else {
    targetColor = "LightGray"; // target is light gray
  }

  switch (visualVariable) {
    case "Shadow":
      targetShadow = shadowIntensity[Math.floor(Math.random()*shadowIntensity.length)];
      shadowIndex = 1;
      motionIndex = 0;
      targetMotion = 0;
      break;
    case "Motion":
      targetShadow = 0;
      shadowIndex = 0;
      motionIndex = 1;
      targetMotion=motionShift[Math.floor(Math.random()*motionShift.length)];
      break;
    case "Both":
      targetShadow = shadowIntensity[Math.floor(Math.random()*shadowIntensity.length)];
      shadowIndex = 1;
      motionIndex = 1;
      targetMotion=motionShift[Math.floor(Math.random()*motionShift.length)];
      break;
    default:
      break;
  }
  // 2. Set the visual appearance of all other objects now that the target appearance is decided
  var objectsAppearance = [];
  for (var i = 0; i < objectCount-1; i++) {
    switch (visualVariable){
      case "Both":
        if(i<(objectCount-1)/3){
          tmpMotion = targetMotion*(-1)+motionShift[motionIndex];
          tmpShadow = targetShadow;
        } else if (i<2*(objectCount-1)/3){
          tmpMotion = targetMotion;
          tmpShadow = targetShadow*(-1)+shadowIntensity[shadowIndex];
        } else {
          tmpMotion = targetMotion*(-1)+motionShift[motionIndex];
          tmpShadow = targetShadow*(-1)+shadowIntensity[shadowIndex];
        }
        // tmpShadow = shadowIntensity[Math.floor(Math.random()*shadowIntensity.length)];
        // tmpMotion = motionShift[Math.floor(Math.random()*motionShift.length)];
        // if (tmpMotion == targetMotion && tmpShadow == targetShadow){
        //   if(Math.floor(Math.random()*2)) {
        //     tmpMotion = targetMotion*(-1)+motionShift[motionIndex];
        //   } else {
        //     tmpShadow = targetShadow*(-1)+shadowIntensity[shadowIndex];
        //   }
        // }
        objectsAppearance.push({
          size: targetSize, 
          color: targetColor, 
          shadow: tmpShadow, 
          motion: tmpMotion
        });
        break;
      default:
        objectsAppearance.push({
          size: targetSize, 
          color: targetColor, 
          shadow: targetShadow*(-1)+shadowIntensity[shadowIndex], 
          motion: targetMotion*(-1)+motionShift[motionIndex]
        });
        break;
    }
    
    /*
    if(targetSize == 25) {
      objectsAppearance.push({
        size: 25,
        color: targetColor
      });
    } else {
      objectsAppearance.push({
        size: 15,
        color: targetColor
      });
    }
    */
  }

  // 3. Shuffle the list of objects (useful when there are variations regarding both visual variable) and add the target at a specific index
  shuffle(objectsAppearance);
  // draw a random index for the target
  ctx.targetIndex = Math.floor(Math.random()*objectCount);
  // and insert it at this specific index
  objectsAppearance.splice(ctx.targetIndex, 0, {size:targetSize, color:targetColor, shadow:targetShadow, motion:targetMotion});

  // 4. We create actual SVG shapes and lay them out as a grid
  // compute coordinates for laying out objects as a grid
  var gridCoords = gridCoordinates(objectCount, 60);
  // display all objects by adding actual SVG shapes
  for (var i = 0; i < objectCount; i++) {
    // console.log(objectsAppearance[i].shadow);
    if (objectsAppearance[i].shadow == shadowIntensity[1] && objectsAppearance[i].motion == motionShift[1]) {
      group.append("circle")
      .attr("id", "circleShape")
      .attr("cx", gridCoords[i].x)
      .attr("cy", gridCoords[i].y)
      .attr("r", objectsAppearance[i].size)
      .attr("fill", objectsAppearance[i].color)
      .attr("filter", "url(#dropshadow)");
    } else if (objectsAppearance[i].shadow == shadowIntensity[1]){
      group.append("circle")
      .attr("cx", gridCoords[i].x)
      .attr("cy", gridCoords[i].y)
      .attr("r", objectsAppearance[i].size)
      .attr("fill", objectsAppearance[i].color)
      .attr("filter", "url(#dropshadow)");
    } else if (objectsAppearance[i].motion == motionShift[1]){
        group.append("circle")
        .attr("id", "circleShape")
        .attr("cx", gridCoords[i].x)
        .attr("cy", gridCoords[i].y)
        .attr("r", objectsAppearance[i].size)
        .attr("fill", objectsAppearance[i].color);
    }  else {
      group.append("circle")
      .attr("cx", gridCoords[i].x)
      .attr("cy", gridCoords[i].y)
      .attr("r", objectsAppearance[i].size)
      .attr("fill", objectsAppearance[i].color);
    }
  }

  if( visualVariable!="Shadow"){
    let circles = svgElement.selectAll('[id*=circleShape');
    let durationTimes = Array.from({length: circles.size()}, () => 300);
    const motion = () => {
      // console.log(durationTimes);
      // console.log(circles.size())
      circles
          .transition()
          .duration(function(d,i){ return durationTimes[i]})
          .delay(300)
          .attrTween("transform", function(){
            return d3.interpolateString( `translateY(0,-5px)`, `translate(0,5)` );
          })
          .transition()
          .duration(function(d,i){return durationTimes[i]})
          .delay(function(d,i){return durationTimes[i]})
          .attrTween("transform", function(){
            return d3.interpolateString( `translateY(0,5px)`, `translate(0,-5)` );
          })
          .on("end", motion);
          }
    
    motion();
  }
}

var displayPlaceholders = function() {
  ctx.state = state.PLACEHOLDERS;

  var oc = ctx.trials[ctx.cpt]["OC"];
  var objectCount = 0;

  if(oc === "Low") {
    objectCount = 9;
  } else if(oc === "Medium") {
    objectCount = 25;
  } else {
    objectCount = 49;
  }

  var svgElement = d3.select("svg");
  var group = svgElement.append("g")
  .attr("id", "placeholders")
  .attr("transform", "translate(100,100)");

  var gridCoords = gridCoordinates(objectCount, 60);
  for (var i = 0; i < objectCount; i++) {
    var placeholder = group.append("rect")
        .attr("id", i)
        .attr("x", gridCoords[i].x-28)
        .attr("y", gridCoords[i].y-28)
        .attr("width", 56)
        .attr("height", 56)
        .attr("fill", "Gray");


    placeholder.on("click",
        function() {
          console.log(this.id);
          d3.select("#placeholders").remove();
          if ( this.id == ctx.targetIndex){
            var tmpLog = ctx.trials[ctx.cpt];
            tmpLog["VisualSearchTime"] = ctx.currentSearchTime;
            tmpLog["ErrorCount"] = ctx.errorCount;
            ctx.loggedTrials.push(Object.keys(tmpLog).map(function(key){return tmpLog[key];}));
            nextTrial();
          }
          else{
            //if wrong, increase error count and redo condition
            //remove last time recording
            ctx.errorCount++;
            ctx.currentSearchTime = 0;
            displayInstructions();
          }
        }
      );
  }
}

var keyListener = function(event) {
  event.preventDefault();

  if(ctx.state == state.INSTRUCTIONS && event.code == "Enter") {
    ctx.currentSearchTime=Date.now();
    d3.select("#instructions").remove();
    displayShapes();
  } else if(ctx.state == state.SHAPES && event.code == "Space") {
    ctx.currentSearchTime=Date.now()- ctx.currentSearchTime;
    d3.select("#shapes").remove();
    displayPlaceholders();
  }
}


var downloadLogs = function(event) {
  event.preventDefault();
  var csvContent = "data:text/csv;charset=utf-8,";
  console.log("logged lines count: "+ctx.loggedTrials.length);
  ctx.loggedTrials.forEach(function(rowArray){
   var row = rowArray.join(",");
   csvContent += row + "\r\n";
   console.log(rowArray);
  });
  var encodedUri = encodeURI(csvContent);
  var downloadLink = d3.select("form")
  .append("a")
  .attr("href",encodedUri)
  .attr("download","logs_"+ctx.trials[ctx.cpt][ctx.participantIndex]+"_"+Date.now()+".csv")
  .text("logs_"+ctx.trials[ctx.cpt][ctx.participantIndex]+"_"+Date.now()+".csv");
}


// returns an array of coordinates for laying out objectCount objects as a grid with an equal number of lines and columns
function gridCoordinates(objectCount, cellSize) {
  var gridSide = Math.sqrt(objectCount);
  var coords = [];
  for (var i = 0; i < objectCount; i++) {
    coords.push({
      x:i%gridSide * cellSize,
      y:Math.floor(i/gridSide) * cellSize + 25*((i%gridSide)%2)
    });
  }
  return coords;
}

// shuffle the elements in the array
// copied from https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
function shuffle(array) {
  var j, x, i;
  for (i = array.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = array[i];
    array[i] = array[j];
    array[j] = x;
  }
  return array;
}

/*********************************************/

var createScene = function(){
  var svgEl = d3.select("#sceneCanvas").append("svg");
  svgEl.attr("width", ctx.w);
  svgEl.attr("height", ctx.h)
  .classed("centered", true);

  loadData(svgEl);

  // filter stuff                       http://4waisenkinder.de/blog/2013/09/28/using-gradient-and-shadows-with-d3-dot-js/
  /* For the shadow filter... */
  // everything that will be referenced
  // should be defined inside of a <defs> element ;)
  var defs = svgEl.append( 'defs' );

  // append filter element
  var filter = defs.append( 'filter' )
                  .attr( 'id', 'dropshadow' ) /// !!! important - define id to reference it later

  // append gaussian blur to filter
  filter.append( 'feGaussianBlur' )
        .attr( 'in', 'SourceAlpha' )
        .attr( 'stdDeviation', shadowIntensity[1] ) // !!! important parameter - blur
        .attr( 'result', 'blur' );

  // append offset filter to result of gaussion blur filter
  filter.append( 'feOffset' )
        .attr( 'in', 'blur' )
        .attr( 'dx', 2 ) // !!! important parameter - x-offset
        .attr( 'dy', 3 ) // !!! important parameter - y-offset
        .attr( 'result', 'offsetBlur' );

  // merge result with original image
  var feMerge = filter.append( 'feMerge' );

  // first layer result of blur and offset
  feMerge.append( 'feMergeNode' )
        .attr( 'in", "offsetBlur' )

  // original image on top
  feMerge.append( 'feMergeNode' )
        .attr( 'in', 'SourceGraphic' );
  // end filter stuff
};


/****************************************/
/******** STARTING PARAMETERS ***********/
/****************************************/

var setTrial = function(trialID) {
  ctx.startTrial = parseInt(trialID);
  console.log("block: " + ctx.startBlock + " trial: " + ctx.startTrial);
}

var setBlock = function(blockID) {
  ctx.startBlock = parseInt(blockID);

  var trial = "";
  var options = [];

  for(var i = 0; i < ctx.trials.length; i++) {
    if(ctx.trials[i][ctx.participantIndex] === ctx.participant) {
      if(parseInt(ctx.trials[i][ctx.blockIndex]) == ctx.startBlock) {
        if(!(ctx.trials[i][ctx.trialIndex] === trial)) {
          trial = ctx.trials[i][ctx.trialIndex];
          options.push(trial);
        }
      }
    }
  }

  var select = d3.select("#trialSel");

  select.selectAll("option")
    .data(options)
    .enter()
    .append("option")
    .text(function (d) { return d; });
    
    var selEl = document.getElementById("trialSel");
    selEl.options[0].selected = true;
    selEl.onchange();

}

var setParticipant = function(participantID) {
  ctx.participant = participantID;

  var block = "";
  var options = [];

  for(var i = 0; i < ctx.trials.length; i++) {
    if(ctx.trials[i][ctx.participantIndex] === ctx.participant) {
      if(!(ctx.trials[i][ctx.blockIndex] === block)
          && (touchstone == 2 || ctx.trials[i][ctx.practiceIndex].toLowerCase() === "false")) {
        block = ctx.trials[i][ctx.blockIndex];
        options.push(block);
      }
    }
  }

  var select = d3.select("#blockSel")
  select.selectAll("option")
    .data(options)
    .enter()
    .append("option")
    .text(function (d) { return d; });

  setBlock(options[0]);
  if (ctx.loggedTrials.length>1)
    downloadLogs();
  displayParticipantChange();

};

function onchangeParticipant() {
  selectValue = d3.select("#participantSel").property("value");
  d3.select("#shapes").remove();
  d3.select("#placeholders").remove();
  d3.select("#instructions").remove();
  setParticipant(selectValue);
};

function onchangeBlock() {
  selectValue = d3.select("#blockSel").property("value");
  d3.select("#shapes").remove();
  d3.select("#placeholders").remove();
  d3.select("#instructions").remove();
  setBlock(selectValue);
};

function onchangeTrial() {
  selectValue = d3.select("#trialSel").property("value");
  d3.select("#shapes").remove();
  d3.select("#placeholders").remove();
  d3.select("#instructions").remove();
  setTrial(selectValue);

};
