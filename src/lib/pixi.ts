import { BatchRenderer, extensions } from "@pixi/core";
import { TickerPlugin } from "@pixi/ticker";

extensions.add(TickerPlugin, BatchRenderer);
