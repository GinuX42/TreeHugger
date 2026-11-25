import test from 'node:test';
import assert from 'node:assert/strict';
import {clampToolbarPosition, createFloatingToolbar} from '../Erweiterung/floating-toolbar.js';

function setup() {
  const listeners = new Map();
  const toolbar = {style: {}, getBoundingClientRect: () => ({left: parseFloat(toolbar.style.left) || 0, top: parseFloat(toolbar.style.top) || 0, width: 290, height: 42})};
  const classes = new Set();
  const handle = {addEventListener: (name, fn) => listeners.set(name, fn), focus() {}, setPointerCapture(id) {this.capture=id;}, classList: {add: x => classes.add(x), remove: x => classes.delete(x)}};
  const viewport = {innerWidth: 1000, innerHeight: 700, addEventListener: (name, fn) => listeners.set(name, fn)};
  const view = createFloatingToolbar({toolbar, handle, viewport});
  function dispatch(name, event = {}) {listeners.get(name)?.({button: 0, pointerId: 1, preventDefault() {}, ...event});}
  return {toolbar, viewport, view, handle, dispatch, classes};
}

test('toolbar starts at the upper right and horizontal dragging keeps the toolbar outside the tree', () => {
  const s=setup();s.view.setActive(true);
  assert.deepEqual(s.toolbar.style,{left:'702px',top:'0px'});
  s.dispatch('pointerdown',{clientX:710,clientY:20});
  s.dispatch('pointermove',{clientX:400,clientY:320});
  assert.deepEqual(s.toolbar.style,{left:'392px',top:'0px'});
  s.dispatch('pointermove',{pointerId:2,clientX:-10000,clientY:-10000});
  assert.equal(s.toolbar.style.left,'392px');
  s.dispatch('pointermove',{clientX:-10000,clientY:10000});
  assert.deepEqual(s.toolbar.style,{left:'8px',top:'0px'});
  s.dispatch('pointercancel');s.dispatch('pointermove',{clientX:600,clientY:600});
  assert.equal(s.classes.has('dragging'),false);assert.equal(s.toolbar.style.left,'8px');
});

test('keyboard movement, resize, focus exit and re-entry preserve usable placement', () => {
  const s=setup();s.view.setActive(true);
  s.dispatch('keydown',{key:'ArrowLeft'});s.dispatch('keydown',{key:'ArrowDown',shiftKey:true});
  assert.deepEqual(s.toolbar.style,{left:'694px',top:'0px'});
  s.view.setActive(false);assert.deepEqual(s.toolbar.style,{left:'',top:''});
  s.view.setActive(true);assert.equal(s.toolbar.style.left,'694px');
  s.viewport.innerWidth=400;s.dispatch('resize');assert.equal(s.toolbar.style.left,'102px');
  s.dispatch('keydown',{key:'Home'});assert.deepEqual(s.toolbar.style,{left:'102px',top:'0px'});
  assert.deepEqual(clampToolbarPosition({x:500,y:500},{width:290,height:42},{width:200,height:30}),{x:8,y:0});
});

test('focus controls start collapsed, expand explicitly and collapse again on re-entry', () => {
  const listeners = {};
  const toolbar = {
    style: {}, collapsed: false,
    classList: {toggle(name, value) {toolbar.collapsed=value;}},
    getBoundingClientRect() {return {left:parseFloat(this.style.left)||0,top:parseFloat(this.style.top)||0,width:this.collapsed?60:380,height:38};}
  };
  const handle = {addEventListener() {},classList:{remove(){}},focus(){}};
  const toggle = {attributes:{},addEventListener(name, fn){listeners[name]=fn;},setAttribute(name,value){this.attributes[name]=value;}};
  const view = createFloatingToolbar({toolbar,handle,toggle,viewport:{innerWidth:1000,innerHeight:700,addEventListener(){}}});
  view.setActive(true);
  assert.equal(toolbar.collapsed,true);assert.equal(toggle.attributes['aria-expanded'],'false');
  assert.equal(toolbar.style.left,'932px');
  listeners.click();assert.equal(toolbar.collapsed,false);assert.equal(toggle.attributes['aria-expanded'],'true');
  assert.equal(toolbar.style.left,'612px');
  listeners.click();assert.equal(toolbar.style.left,'932px');
  view.setActive(false);view.setActive(true);assert.equal(toolbar.collapsed,true);
});
