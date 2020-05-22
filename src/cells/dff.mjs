"use strict";

import * as joint from 'jointjs';
import { Box, BoxView } from './base';
import bigInt from 'big-integer';
import * as help from '../help.mjs';
import { Vector3vl } from '3vl';

// D flip-flops
export const Dff = Box.define('Dff', {
    /* default properties */
    bits: 1,
    polarity: { clock: true },
    initial: 'x',
    
    ports: {
        groups: {
            'in': {
                position: Box.prototype.getStackedPosition({ side: 'left' })
            },
            'out': {
                position: Box.prototype.getStackedPosition({ side: 'right' })
            }
        }
    }
}, {
    initialize: function() {
        Box.prototype.initialize.apply(this, arguments);
        
        const bits = this.prop('bits');
        const initial = this.prop('initial');
        const polarity = this.prop('polarity');
        
        this.addPorts([
            { id: 'in', group: 'in', dir: 'in', bits: bits, portlabel: 'D' },
            { id: 'out', group: 'out', dir: 'out', bits: bits, portlabel: 'Q' }
        ], { labelled: true });
        this.prop('outputSignals/out', Vector3vl.fromBin(initial, bits));
        
        if ('arst' in polarity && this.prop('arst_value'))
            this.prop('arst_value', Array(bits).fill('0').join(''));
        
        let num = 1;
        if ('clock' in polarity) {
            num++;
            this.addPort({ id: 'clk', group: 'in', dir: 'in', bits: 1, polarity: polarity.clock, decor: Box.prototype.decorClock },  { labelled: true });
        }
        if ('arst' in polarity) {
            num++;
            this.addPort({ id: 'arst', group: 'in', dir: 'in', bits: 1, polarity: polarity.arst }, { labelled: true });
        }
        if ('enable' in polarity) {
            num++;
            this.addPort({ id: 'en', group: 'in', dir: 'in', bits: 1, polarity: polarity.enable }, { labelled: true });
        }
        
        this.prop('size', { width: 80, height: num*16+8 });
        
        this.last_clk = 0;
    },
    operation: function(data) {
        const polarity = this.get('polarity');
        const pol = what => polarity[what] ? 1 : -1
        let last_clk;
        if ('clock' in polarity) {
            last_clk = this.last_clk;
            this.last_clk = data.clk.get(0);
        };
        if ('enable' in polarity && data.en.get(0) != pol('enable'))
            return this.get('outputSignals');
        if ('arst' in polarity && data.arst.get(0) == pol('arst'))
            return { out: Vector3vl.fromBin(this.get('arst_value'), this.get('bits')) };
        if ('clock' in polarity) {
            if (data.clk.get(0) == pol('clock') && last_clk == -pol('clock'))
                return { out: data.in };
            else
                return this.get('outputSignals');
        } else return { out: data.in };
    },
    gateParams: Box.prototype.gateParams.concat(['polarity', 'bits', 'initial']),
    unsupportedPropChanges: Box.prototype.unsupportedPropChanges.concat(['polarity', 'bits', 'initial'])
});
export const DffView = BoxView.extend({
    autoResizeBox: true
});
