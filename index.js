import { readFileSync } from "fs";

let variables = {};

function parseLine(line) {
  line = line.trim();
  if (line.startsWith("set ")) {
    const [_, name, value] = line.match(/set (\w+) = "(.*)"/);
    variables[name] = value;
    return "";
  }

  if (line.startsWith("onJoin")) {
    const msg = line.match(/say\("(.*)"\)/)[1];
    return `register("playerJoined", () => ChatLib.chat("${msg}"));`;
  }

  if (line.startsWith("onLeave")) {
    const msg = line.match(/say\("(.*)"\)/)[1];
    return `register("playerLeft", () => ChatLib.chat("${msg}"));`;
  }

  if (line.startsWith("onChat")) {
    const [_, trigger, response] = line.match(/onChat\("(.*)"\) -> say\("(.*)"\)/);
    return `register("chat", (msg) => { if (msg.includes("${trigger}")) ChatLib.chat("${response}"); });`;
  }

  if (line.startsWith("onCommand")) {
    const [_, cmd, response] = line.match(/onCommand\("(.*)"\) -> say\("(.*)"\)/);
    return `register("command", () => ChatLib.chat("${response}")).setName("${cmd}");`;
  }

  if (line.startsWith("repeat every")) {
    const [_, seconds, msg] = line.match(/repeat every (\d+)s -> say\("(.*)"\)/);
    return `setInterval(() => ChatLib.chat("${msg}"), ${seconds * 1000});`;
  }

  if (line.startsWith("if")) {
    const [_, varName, value, msg] = line.match(/if (\w+) == "(.*)" -> say\("(.*)"\)/);
    return `if (variables["${varName}"] === "${value}") ChatLib.chat("${msg}");`;
  }

  if (line.startsWith("title")) {
    const [_, main, sub] = line.match(/title\("(.*)", "(.*)"\)/);
    return `Client.showTitle("${main}", "${sub}", 10, 40, 10);`;
  }

  if (line.startsWith("sound")) {
    const sound = line.match(/sound\("(.*)"\)/)[1];
    return `World.playSound("${sound}", 1, 1);`;
  }

  return "";
}

// Load and parse the script
const script = readFileSync("MyHousingLang/imports/script.mhl", "utf-8");
const lines = script.split("\n").map(parseLine).filter(Boolean).join("\n");

// Run the translated code
eval(lines);
