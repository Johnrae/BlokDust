import PreEffect = require("../PreEffect");
import ISource = require("../../ISource");
import Grid = require("../../../Grid");
import BlocksSketch = require("../../../BlocksSketch");
import ToneSource = require("../../Sources/ToneSource");
import Soundcloud = require("../../Sources/Soundcloud");
import Granular = require("../../Sources/Granular");
import Recorder = require("../../Sources/Recorder");

class Pitch extends PreEffect {

    public PitchIncrement: number;

    Init(sketch?: Fayde.Drawing.SketchContext): void {

        this.PitchIncrement = 1.5; // Pitch decreases by 4ths

        super.Init(sketch);

        // Define Outline for HitTest
        this.Outline.push(new Point(-1, 0),new Point(0, -1),new Point(2, -1),new Point(0, 1));
    }

    Draw() {
        super.Draw();
        (<BlocksSketch>this.Sketch).BlockSprites.Draw(this.Position,true,"pitch");
    }

    Dispose(){
        this.PitchIncrement = null;
    }

    Attach(source: ISource): void {
        super.Attach(source);
        this.UpdatePitch(source);
    }

    Detach(source: ISource): void{
        super.Detach(source);
        this.UpdatePitch(source);
    }

    UpdatePitch(source: ISource): void{

        // TODO: GIVE ALL SOURCES A PITCH PROPERTY


        //OSCILLATORS
        if (source instanceof ToneSource){
            source.Sources.forEach((s: Tone.Oscillator) => {
                s.frequency.exponentialRampToValueNow(source.Frequency * this._GetConnectedPitchPreEffects(source), 0);
            });


            // TONE.PLAYERS
        } else if (source instanceof Soundcloud){
            source.Sources.forEach((s: Tone.Sampler) => {
                s.player.playbackRate = source.PlaybackRate * this._GetConnectedPitchPreEffects(source);
            });


            // GRANULAR
        } else if (source instanceof Granular) {
            for (var i=0; i<source.MaxDensity; i++) {
                source.Grains[i].playbackRate = source.PlaybackRate * this._GetConnectedPitchPreEffects(source);
            }

            // RECORDER
        } else if (source instanceof Recorder) {
            source.Sources.forEach((s: Tone.Sampler) => {
                s.player.playbackRate = source.PlaybackRate * this._GetConnectedPitchPreEffects(source);
            });
        }

    }

    SetParam(param: string,value: number) {
        super.SetParam(param,value);
        var jsonVariable = {};
        jsonVariable[param] = value;

        if (param == "pitchMultiplier") {
            this.PitchIncrement = value;

            if (this.Sources.Count) {
                for (var i = 0; i < this.Sources.Count; i++) {
                    var source = this.Sources.GetValueAt(i);

                    this.UpdatePitch(source);
                }
            }
        }
    }

    GetParam(param: string) {
        super.GetParam(param);
        var val;

        if (param == "pitchMultiplier") {
            val = this.PitchIncrement;
        }
        return val;
    }

    UpdateOptionsForm() {
        super.UpdateOptionsForm();

        this.OptionsForm =
        {
            "name" : "Pitch",
            "parameters" : [

                {
                    "type" : "slider",
                    "name" : "Pitch",
                    "setting" :"pitchMultiplier",
                    "props" : {
                        "value" : this.GetParam('pitchMultiplier'),
                        "min" : 0.5,
                        "max" : 2,
                        "quantised" : false,
                        "centered" : true,
                        "logarithmic": true
                    }
                }
            ]
        };
    }

    private _GetConnectedPitchPreEffects(source) {

        var totalPitchIncrement: number = 1;

        for (var i = 0; i < source.Effects.Count; i++) {
            var effect = source.Effects.GetValueAt(i);

            if ((<Pitch>effect).PitchIncrement) {
                var thisPitchIncrement = (<Pitch>effect).PitchIncrement;
                totalPitchIncrement *= thisPitchIncrement;
            }
        }

        return totalPitchIncrement;
    }
}

export = Pitch;