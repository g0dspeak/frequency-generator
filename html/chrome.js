var channel_count=0;
var channels={}

var master_graph=null;
var generator=null;
var display_width=2;
var plot_density=false;
var btn_vol=null;
var btn_particle=null;
var btn_multichannel=null;
var multichannel=true;


function init()
{
	// Style the master graph
	var canvas=document.getElementById('master_graph');
	// canvas.style.background='#dddddd';
	master_graph=new Graph(canvas,{axis_color:'black'});
	master_graph.axis_y=false;
	master_graph.set_limits(0,display_width,-1,1);
	master_graph.x_ticks=get_ticks(8);
	master_graph.tick_format=function(tick) { return sprintf('%0.2fm',tick); };
	master_graph.reset();
	// Create the tone generator
	generator=new ToneGenerator();
	// Check for resizes
	window.addEventListener("resize",draw_waves);
	// Add a channel
	add_channel();
	// get volume events
	btn_vol=document.getElementById('btn_vol').getSVGDocument().defaultView;
	btn_vol.addEventListener("click", function() {btn_vol.toggle_mute(); update_vol();});
	btn_vol.mute();
	// setup the add button event
	document.getElementById('btn_add').getSVGDocument().defaultView.addEventListener("click", add_channel);
	// setup the particle button event
	btn_particle=document.getElementById('btn_particles').getSVGDocument().defaultView
	btn_particle.addEventListener("click", toggle_particles);
	btn_particle.disable();
	// setup the multichannel button
	btn_multichannel=document.getElementById('btn_multichannel').getSVGDocument().defaultView
	btn_multichannel.addEventListener("click", toggle_multichannel);
}

function delete_channels()
{
	for( var channel in channels )
	{
		delete_channel(channel);
	}
}

function delete_channel(channel_id)
{
	var board=document.getElementById("channel_board");
	var channel=document.getElementById(channel_id);
	delete channels[channel_id];
	board.removeChild(channel);
	generator.removeSource(channel_id);
	draw_master();
}

function get_ticks(count)
{
	var delta=display_width/count;
	var ticks=[]
	for( i=1; i<count; i++ )
	{
		ticks[i-1]=i*delta;
	}
	return ticks;
}

function add_channel()
{
	var board=document.getElementById("channel_board");

	// Create the channel
	var channel=document.createElement("div");
	channel.className="channel";
	var channel_id="c"+channel_count++;
	channel.id=channel_id;
	channels[channel_id]=channel;
	board.appendChild(channel)

	// Create the title
	var title=document.createElement("h2");
	title.className="multichannel"
	title.innerHTML="Channel "+channel_count;
	channel.appendChild(title);

	// Create the graph	
	var canvas=document.createElement("canvas");
	canvas.className='graph';
	channel.appendChild(canvas);
	var graph=new Graph(canvas,{axis_color:"black"});
	graph.axis_y=false;
	graph.set_limits(0,display_width,-1,1);
	graph.x_ticks=get_ticks(8);
	graph.tick_format=function(tick) { return sprintf('%0.2fm',tick); };
	graph.reset();
	channel.graph=graph

	// Create the controls
	var t=document.createElement('table');
	t.className='channel_controls';
	channel.appendChild(t);

	var label_row=document.createElement('tr');
	t.appendChild(label_row);
	var input_row=document.createElement('tr');
	t.appendChild(input_row);

	// Create the frequency inputs
	var f_label_cell=document.createElement('td');
	label_row.appendChild(f_label_cell);	
	var f_input_cell=document.createElement('td');
	input_row.appendChild(f_input_cell);

	var f_label=document.createElement('span');
	f_label.innerHTML='Frequency:';
	f_label.className="label";
	f_label_cell.appendChild(f_label);

	var f_display=document.createElement('input');
	f_display.type="text";
	f_display.className='frequency_display value_display';
	f_display.value='0';
	f_display.addEventListener("change",function() { channel.frequency.setValue(f_display.value); update_wave(channel_id); f_display.blur();} );
	f_label_cell.appendChild(f_display);
	channel.frequency_display=f_display;

	var f_unit_display=document.createElement('span');
	f_unit_display.className='unit_display';
	f_unit_display.innerHTML='Hz';
	f_label_cell.appendChild(f_unit_display);

	var f_range=document.createElement('input');
	f_range.id=channel_id+'_f';
	f_range.type="range";
	f_range.className="frequency_range";
	f_range.addEventListener("change",function() { update_wave(channel_id); } );
	f_input_cell.appendChild(f_range);
	channel.frequency=new LogRange(f_range,100,10000,10000);


	// Create the amplitude inputs
	var A_label_cell=document.createElement('td');
	label_row.appendChild(A_label_cell);	
	var A_input_cell=document.createElement('td');
	input_row.appendChild(A_input_cell);
	
	var A_label=document.createElement('span');
	A_label.innerHTML='Amplitude:';
	A_label.className="label";
	A_label_cell.appendChild(A_label);
	
	var A_display=document.createElement('input');
	A_display.type="text";
	A_display.className='amplitude_display value_display';
	A_display.value='0';
	A_display.addEventListener("change",function() { channel.amplitude.value=(10*A_display.value); update_wave(channel_id); A_display.blur();} );
	A_label_cell.appendChild(A_display);
	channel.amplitude_display=A_display;

	var A_unit_display=document.createElement('span');
	A_unit_display.className='unit_display';
	A_unit_display.innerHTML='%';
	A_label_cell.appendChild(A_unit_display);

	var A_range=document.createElement('input');
	A_range.id=channel_id+'_amp';
	A_range.type="range";
	A_range.className="amplitude_range";
	A_range.addEventListener("change",function() { update_wave(channel_id); } );
	A_range.min=0;
	A_range.max=1000;
	A_range.value=500;
	channel.amplitude=A_range;
	A_input_cell.appendChild(A_range);	

	// Create the phase input
	var phase_label_cell=document.createElement('td');
	phase_label_cell.className='multichannel';
	label_row.appendChild(phase_label_cell);	
	var phase_input_cell=document.createElement('td');
	phase_input_cell.className='multichannel';
	input_row.appendChild(phase_input_cell);
	
	var phase_div=document.createElement('div')
	channel.appendChild(phase_div);

	var phase_label=document.createElement('span');
	phase_label.innerHTML='Phase:';
	phase_label.className="label";
	phase_label_cell.appendChild(phase_label);
	
	var phase_display=document.createElement('input');
	phase_display.type="text";
	phase_display.className='phase_display value_display';
	phase_display.value='0';
	phase_display.addEventListener("change",function(e) { channel.phase.value=(1000*phase_display.value/360); update_wave(channel_id); phase_display.blur();} );
	phase_label_cell.appendChild(phase_display);
	channel.phase_display=phase_display;

	var phase_unit_display=document.createElement('span');
	phase_unit_display.className='unit_display';
	phase_unit_display.innerHTML='°';
	phase_label_cell.appendChild(phase_unit_display);

	var phase_range=document.createElement('input');
	phase_range.id=channel_id+'_amp';
	phase_range.type="range";
	phase_range.className="amplitude_range";
	phase_range.addEventListener("change",function() { update_wave(channel_id); } );
	phase_range.min=0;
	phase_range.max=1000;
	phase_range.value=0;
	channel.phase=phase_range;
	phase_input_cell.appendChild(phase_range);	

	// Create the play/pause/delete controls
	var controls = document.createElement('div');
	controls.className="controls";
	channel.appendChild(controls);

	var delete_btn=document.createElement('embed');
	delete_btn.id=channel_id+"_btn_delete";
	delete_btn.src="trash_can.svg";
	delete_btn.height="20";
	delete_btn.className="multichannel";
	delete_btn.addEventListener("load",function() { 
		delete_btn.getSVGDocument().defaultView.addEventListener("click", function() { delete_channel(channel_id); } );
	} );
	// controls.appendChild(delete_btn);
	title.appendChild(delete_btn);

	// Create the channel wave source
	var source = new Sinewave();
	channel.frequency.setValue(source.f0);
	A_range.value=channel.A0*A_range.max;
	channel.source=source;
	generator.addSource(channel_id,source);

	// Update the display of this channel
	update_wave(channel_id);
}


function update_wave(channel_id)
{
	var channel=document.getElementById(channel_id);
	// The space used in the format strings below is a non-breaking space
	// Unicode character #00A0
	// Update frequency 
	var f=Math.round(channel.frequency.getValue());
	channel.frequency_display.value=f;  
	channel.source.f=f;  // Round to integer frequencies
	// Update Amplitude
	var A=parseInt(channel.amplitude.value)/1000;
	channel.amplitude_display.value=sprintf("%0.1f",A*100);  
	channel.source.A=A;
	// Update Phase
	var phase=-2*Math.PI*parseInt(channel.phase.value)/1000;
	channel.phase_display.value=Math.round(360*phase/(-2*Math.PI));
	channel.source.phase=phase;

	// Draw the changed wave and the master
	draw_wave(channel_id);
	draw_master();
}

function draw_master()
{
	var func=function(x)
	{
		var y=0;
		var channel_count=0;
		for( channel_id in channels)
		{
			var channel=document.getElementById(channel_id);
			y+=channel.source.waveform(x);
			channel_count++;
		}
		return y/channel_count;
	}
	master_graph.reset();
	if( plot_density )
	{
		master_graph.plotDensity(func);
	}
	master_graph.plot(func,"greenyellow",3);
	master_graph.draw_axes();
}

function draw_waves()
{
	for( channel_id in channels)
	{
		draw_wave(channel_id)
	}
	draw_master();
}

function draw_wave(channel_id)
{
	var channel=document.getElementById(channel_id);
	var func=function (x) { return channel.source.waveform(x); };
	channel.graph.reset();
	if( plot_density)
	{	
		channel.graph.plotDensity(func);
	}
	channel.graph.plot(func,"aquamarine",3);
	channel.graph.draw_axes();
}

function update_display_width()
{
	display_width=parseInt(document.getElementById('display_width').value)/10;
	for( channel_id in channels)
	{
		var channel=channels[channel_id];
		channel.graph.set_x_limits(0,display_width);
		channel.graph.x_ticks=get_ticks(8);
		draw_wave(channel_id);
	}
	master_graph.set_x_limits(0,display_width);
	master_graph.x_ticks=get_ticks(8);
	draw_master();
}

function update_vol()
{
	if(btn_vol.m)
	{
		pause();
	}
	else
	{ 
		play();
	}
}
function play()
{
	for( channel_id in channels)
	{
		var channel=channels[channel_id];
		channel.source.syncProperties();
		channel.source._phase=0;
	}
	generator.play();
}

function pause()
{
	generator.pause()
}

function toggle_particles()
{
	plot_density=!plot_density;
	if( plot_density )
	{
		btn_particle.enable();
	}
	else
	{
		btn_particle.disable();
	}
	draw_waves();
}

function getCSSRule(selectorText)
{
	for( var i=0; i<document.styleSheets.length; i++ )
	{
		var rules=document.styleSheets[i].rules;
		for( var j=0; j<rules.length; j++ )
		{
			if(rules[j].selectorText==selectorText)
			{
				return rules[j];
			}
		}
	}
	return null;
}

function toggle_multichannel()
{
	multichannel=!multichannel;
	if( multichannel )
	{
		btn_multichannel.enable();
		btn_add=document.getElementById('btn_add');
		btn_add.addEventListener("load",function() { 
			console.log('btn_add loaded');
			btn_add.getSVGDocument().defaultView.addEventListener("click", add_channel );
		} );
		getCSSRule('.multichannel').style.display="";
		draw_waves();
	}
	else
	{
		btn_multichannel.disable();
		delete_channels();
		channel_count=0;
		add_channel();
		getCSSRule('.multichannel').style.display="none";
	}
}
