import { readFileSync } from "fs";

let variables = {};
let customEvents = {};

function replacePlaceholders(text) {
  return text
    .replace(/%player%/g, Player.getName())
    .replace(/%x%/g, Math.floor(Player.getX()))
    .replace(/%y%/g, Math.floor(Player.getY()))
    .replace(/%z%/g, Math.floor(Player.getZ()))
    .replace(/%name%/g, variables["name"] || "");
}

function parseLine(line) {
  line = line.trim();
  if (line.startsWith("set ")) {
    const [_, name, value] = line.match(/set (\w+) = "(.*)"/);
    variables[name] = value;
    return "";
  }

  if (line.startsWith("onJoin")) {
    const msg = replacePlaceholders(line.match(/say\("(.*)"\)/)[1]);
    return `register("playerJoined", () => ChatLib.chat("${msg}"));`;
  }

  if (line.startsWith("onLeave")) {
    const msg = replacePlaceholders(line.match(/say\("(.*)"\)/)[1]);
    return `register("playerLeft", () => ChatLib.chat("${msg}"));`;
  }

  if (line.startsWith("onChat")) {
    const [_, trigger, response] = line.match(/onChat\("(.*)"\) -> say\("(.*)"\)/);
    return `register("chat", (msg) => { if (msg.includes("${trigger}")) ChatLib.chat("${replacePlaceholders(response)}"); });`;
  }

  if (line.startsWith("onCommand")) {
    const [_, cmd, response] = line.match(/onCommand\("(.*)"\) -> say\("(.*)"\)/);
    return `register("command", () => ChatLib.chat("${replacePlaceholders(response)}")).setName("${cmd}");`;
  }

  if (line.startsWith("repeat every")) {
    const [_, seconds, msg] = line.match(/repeat every (\d+)s -> say\("(.*)"\)/);
    return `setInterval(() => ChatLib.chat("${replacePlaceholders(msg)}"), ${seconds * 1000});`;
  }

  if (line.startsWith("if")) {
    const [_, varName, value, msg] = line.match(/if (\w+) == "(.*)" -> say\("(.*)"\)/);
    return `if (variables["${varName}"] === "${value}") ChatLib.chat("${replacePlaceholders(msg)}");`;
  }

  if (line.startsWith("title")) {
    const [_, main, sub] = line.match(/title\("(.*)", "(.*)"\)/);
    return `Client.showTitle("${replacePlaceholders(main)}", "${replacePlaceholders(sub)}", 10, 40, 10);`;
  }

  if (line.startsWith("sound")) {
    const sound = line.match(/sound\("(.*)"\)/)[1];
    return `World.playSound("${sound}", 1, 1);`;
  }

  if (line.startsWith("teleport")) {
    const [_, x, y, z] = line.match(/teleport\("(.*)", "(.*)", "(.*)"\)/);
    return `ChatLib.command("tp ${x} ${y} ${z}");`;
  }

  if (line.startsWith("give")) {
    const item = line.match(/give\("(.*)"\)/)[1];
    return `ChatLib.command("give @p ${item}");`;
  }

  if (line.startsWith("setblock")) {
    const [_, x, y, z, block] = line.match(/setblock\("(.*)", "(.*)", "(.*)", "(.*)"\)/);
    return `ChatLib.command("setblock ${x} ${y} ${z} ${block}");`;
  }

  if (line.startsWith("event")) {
    const eventName = line.match(/event\("(.*)"\)/)[1];
    customEvents[eventName] = [];
    return "";
  }

  if (line.startsWith("trigger")) {
    const eventName = line.match(/trigger\("(.*)"\)/)[1];
    return `customEvents["${eventName}"].forEach(fn => fn());`;
  }

  if (line.includes("->")) {
    const [trigger, action] = line.split("->").map(s => s.trim());
    const eventName = trigger.match(/event\("(.*)"\)/)?.[1];
    const actionCode = parseLine(action);
    if (eventName && actionCode) {
      return `customEvents["${eventName}"].push(() => { ${actionCode} });`;
    }
  }

  return "";
}

// Load and parse the script
const script = readFileSync("./imports/script.mhl", "utf-8");
const lines = script.split("\n").map(parseLine).filter(Boolean).join("\n");

// Run the translated code
eval(lines);
