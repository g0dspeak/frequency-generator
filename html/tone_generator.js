var tone_generator_version=4;
var twopi=Math.PI*2

function ToneGenerator()
{
	var generator=this;
	this.source_count=0;
	this.context = new AudioContext();
	this.sources={};
	this.bufferSize=8192;
	this.node = this.context.createScriptProcessor(this.bufferSize, 1, 1);
	this.sampleRate = this.context.sampleRate
	this.playing=true;

	function play()
	{
		this.playing=true;
		this.node.connect(this.context.destination);
	}
	this.play=play;

	function pause() 
	{
		this.playing=false;
		this.node.disconnect();
	}
	this.pause=pause;

	function addSource(id,source)
	{
		this.sources[id]=source;
		source.sampleRate=this.sampleRate;
		this.source_count++;
	}
	this.addSource=addSource

	function removeSource(id)
	{
		delete this.sources[id];
		this.source_count--
	}
	this.removeSource=removeSource

	function process(e)
	{
		var playbackTime=e.playbackTime; // this attr is in the API but not implemented
		var data = e.outputBuffer.getChannelData(0);
		// Set the initial value to zero
		for (var i = 0; i < data.length; i++) 
		{
			data[i]=0;
		}
		for( id in this.sources )
		{
			this.sources[id].process(data,playbackTime,1/this.source_count)
		}
	}
	this.process=process;
	this.node.onaudioprocess = function(e) { generator.process(e) };
}

function Sinewave() 
{
	this.A0=.5; // initial frequency
	this.A=.5; // final frequency
	this.f0=440; // initial frequency (Hz)
	this.f=440; // Frequency in Hz
	this.phase0=0; // initial phase offset
	this.phase=0; // phase
	this.v=343.2
	this._phase=0; // phase offset from previous block of data
	this.sampleRate=0;

	function waveform(x)
	{
		var lambda=this.v/this.f;
		var k=1/lambda;  // the wave number
		return this.A*Math.sin(2*Math.PI*k*x+this.phase); 
	}
	this.waveform=waveform

	function syncProperties()
	{
		this.f0=this.f
		this.A0=this.A
		this.phase0=this.phase;
	}
	this.syncProperties=syncProperties;

	function process(data,playbackTime,scale) 
	{
		var t=data.length/this.sampleRate;
		// calculate rate of frequency change
		var k=(this.f-this.f0)/t;
		// calculate rate of amplitude change
		var kA=(this.A-this.A0)/data.length;
		// calculate rate of phase change
		var kPhase=(this.phase-this.phase0)/data.length;
		for (var i = 0; i < data.length; i++) 
		{
			t=i/this.sampleRate
			data[i] += scale*(this.A0+kA*i)*Math.sin( twopi*(this.f0*t + (k/2)*t*t+this._phase)+ this.phase0 + kPhase*i);	
		}
		// calculate the phase offset for the next set of data
		t=data.length/this.sampleRate
		var arg=twopi*(this.f0*t + (k/2)*t*t+this._phase);
		this._phase=arg/twopi-Math.floor(arg/twopi);
		// set the 
		this.syncProperties();
	}
	this.process=process;
}
