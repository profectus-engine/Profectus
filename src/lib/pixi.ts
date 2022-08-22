import { Application } from "@pixi/app";
import { BatchRenderer, Renderer } from "@pixi/core";
import { TickerPlugin } from "@pixi/ticker";

Application.registerPlugin(TickerPlugin);

Renderer.registerPlugin("batch", BatchRenderer);
