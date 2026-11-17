import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';
import { initNative } from './lib/native';

void initNative();

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
