import PptxGenJS from "pptxgenjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assets = join(root, "docs", "pitch-assets");
const out = join(root, "docs", "ModelLedger-Pitch.pptx");

const ink = "171410";
const paper = "F3EEE3";
const card = "FFFDF8";
const seal = "9A2F28";
const leaf = "236348";
const warn = "9A6B16";
const muted = "5F574C";
const line = "E0D5C2";

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";
pptx.author = "BroCode";
pptx.title = "ModelLedger — BroCode Pitch";

function bg(slide) {
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0,
    y: 0,
    w: "100%",
    h: "100%",
    fill: { color: paper },
  });
}

function footer(slide, n, total = 12) {
  slide.addText(`ModelLedger · BroCode · BNB  ·  ${n}/${total}`, {
    x: 0.5,
    y: 7.1,
    w: 12.3,
    h: 0.25,
    fontSize: 11,
    color: muted,
    fontFace: "Arial",
  });
}

function titleBar(slide, eyebrow, title) {
  slide.addText(eyebrow, {
    x: 0.6,
    y: 0.35,
    w: 12,
    h: 0.35,
    fontSize: 14,
    color: seal,
    bold: true,
    fontFace: "Arial",
  });
  slide.addText(title, {
    x: 0.6,
    y: 0.7,
    w: 12,
    h: 0.7,
    fontSize: 32,
    color: ink,
    bold: true,
    fontFace: "Georgia",
  });
}

// 1 Title
{
  const s = pptx.addSlide();
  bg(s);
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.6,
    y: 0.5,
    w: 0.7,
    h: 0.7,
    fill: { color: seal },
    rectRadius: 0.12,
  });
  s.addText("M", {
    x: 0.6,
    y: 0.55,
    w: 0.7,
    h: 0.6,
    fontSize: 28,
    color: "FFFFFF",
    align: "center",
    bold: true,
    fontFace: "Arial",
  });
  s.addText("ModelLedger", {
    x: 1.5,
    y: 0.55,
    w: 8,
    h: 0.6,
    fontSize: 36,
    color: ink,
    fontFace: "Georgia",
    bold: true,
  });
  s.addText("Prove the story of an AI picture", {
    x: 0.6,
    y: 2.2,
    w: 12,
    h: 0.8,
    fontSize: 40,
    color: ink,
    fontFace: "Georgia",
  });
  s.addText(
    "Companies stamp. Anyone checks.\nTrusted · Self-asserted · Unverifiable\nNotebook on BNB Smart Chain testnet",
    {
      x: 0.6,
      y: 3.3,
      w: 10,
      h: 1.5,
      fontSize: 20,
      color: muted,
      fontFace: "Arial",
      lineSpacing: 32,
    },
  );
  s.addText("BroCode · Maharashtra · Blockchain problem 3", {
    x: 0.6,
    y: 6.5,
    w: 10,
    h: 0.35,
    fontSize: 14,
    color: seal,
    bold: true,
    fontFace: "Arial",
  });
  footer(s, 1);
}

// 2 Problem
{
  const s = pptx.addSlide();
  bg(s);
  titleBar(s, "The problem", "Anyone can claim “we made this.”");
  const boxes = [
    { t: "AI images are everywhere", d: "Models spit out pictures every second." },
    { t: "Claims are cheap", d: "Download + caption = fake provenance." },
    { t: "No public check", d: "Users can’t verify company + model + history." },
  ];
  boxes.forEach((b, i) => {
    const x = 0.6 + i * 4.1;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x,
      y: 2.0,
      w: 3.8,
      h: 3.4,
      fill: { color: card },
      line: { color: line, width: 1 },
      rectRadius: 0.15,
    });
    s.addText(String(i + 1), {
      x: x + 0.3,
      y: 2.3,
      w: 1,
      h: 0.4,
      fontSize: 18,
      color: seal,
      bold: true,
      fontFace: "Arial",
    });
    s.addText(b.t, {
      x: x + 0.3,
      y: 3.0,
      w: 3.2,
      h: 1.0,
      fontSize: 22,
      color: ink,
      fontFace: "Georgia",
    });
    s.addText(b.d, {
      x: x + 0.3,
      y: 4.2,
      w: 3.2,
      h: 0.9,
      fontSize: 16,
      color: muted,
      fontFace: "Arial",
    });
  });
  footer(s, 2);
}

// 3 Solution
{
  const s = pptx.addSlide();
  bg(s);
  titleBar(s, "Our solution", "A stamp notebook for pictures");
  s.addText(
    "Allowed companies stamp a picture when they create, edit, or post it — with the AI model and time.\nLater, anyone uploads the file and gets one clear answer.",
    {
      x: 0.6,
      y: 1.7,
      w: 12,
      h: 1.2,
      fontSize: 20,
      color: muted,
      fontFace: "Arial",
    },
  );
  const answers = [
    { t: "Trusted", c: leaf, d: "Real stamp. File still matches." },
    { t: "Self-asserted", c: warn, d: "Someone claimed a name. No stamp." },
    { t: "Unverifiable", c: seal, d: "Story missing, broken, or unclear." },
  ];
  answers.forEach((a, i) => {
    const x = 0.6 + i * 4.1;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x,
      y: 3.3,
      w: 3.8,
      h: 2.4,
      fill: { color: a.c },
      rectRadius: 0.15,
    });
    s.addText(a.t, {
      x: x + 0.25,
      y: 3.7,
      w: 3.3,
      h: 0.6,
      fontSize: 24,
      color: "FFFFFF",
      bold: true,
      fontFace: "Arial",
    });
    s.addText(a.d, {
      x: x + 0.25,
      y: 4.5,
      w: 3.3,
      h: 0.8,
      fontSize: 16,
      color: "FFFFFF",
      fontFace: "Arial",
    });
  });
  footer(s, 3);
}

// 4 Flow overview
{
  const s = pptx.addSlide();
  bg(s);
  titleBar(s, "How it works", "Two doors · one notebook");
  const steps = [
    { n: "1", t: "Register", d: "Company + models\n+ API key" },
    { n: "2", t: "Stamp", d: "Create → Edit → Publish\n(website or API)" },
    { n: "3", t: "Check", d: "Anyone uploads\n→ one answer" },
  ];
  steps.forEach((st, i) => {
    const x = 0.8 + i * 4.2;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x,
      y: 2.2,
      w: 3.4,
      h: 3.2,
      fill: { color: card },
      line: { color: line, width: 1.5 },
      rectRadius: 0.15,
    });
    s.addShape(pptx.shapes.OVAL, {
      x: x + 1.25,
      y: 2.5,
      w: 0.9,
      h: 0.9,
      fill: { color: ink },
    });
    s.addText(st.n, {
      x: x + 1.25,
      y: 2.65,
      w: 0.9,
      h: 0.6,
      fontSize: 24,
      color: "FFFFFF",
      align: "center",
      bold: true,
      fontFace: "Arial",
    });
    s.addText(st.t, {
      x: x + 0.2,
      y: 3.6,
      w: 3.0,
      h: 0.5,
      fontSize: 24,
      color: ink,
      align: "center",
      fontFace: "Georgia",
    });
    s.addText(st.d, {
      x: x + 0.2,
      y: 4.3,
      w: 3.0,
      h: 0.9,
      fontSize: 16,
      color: muted,
      align: "center",
      fontFace: "Arial",
    });
    if (i < 2) {
      s.addText("→", {
        x: x + 3.35,
        y: 3.4,
        w: 0.7,
        h: 0.5,
        fontSize: 28,
        color: seal,
        align: "center",
      });
    }
  });
  footer(s, 4);
}

// 5 Company API flow
{
  const s = pptx.addSlide();
  bg(s);
  titleBar(s, "Real product = company API", "Website is the demo remote");
  const flow = [
    { t: "AI company\nregisters", d: "Maker + models\n+ API key" },
    { t: "Their app\ngenerates image", d: "Their model,\ntheir pipeline" },
    { t: "Call Stamp API\nwith key", d: "We stamp file\n+ notebook line" },
    { t: "Client gets\nstamped file", d: "Anyone can\nCheck later" },
  ];
  flow.forEach((f, i) => {
    const x = 0.45 + i * 3.2;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x,
      y: 2.1,
      w: 2.95,
      h: 3.5,
      fill: { color: i === 2 ? seal : card },
      line: { color: i === 2 ? seal : line, width: 1 },
      rectRadius: 0.12,
    });
    s.addText(f.t, {
      x: x + 0.15,
      y: 2.5,
      w: 2.65,
      h: 1.3,
      fontSize: 18,
      color: i === 2 ? "FFFFFF" : ink,
      align: "center",
      bold: true,
      fontFace: "Arial",
    });
    s.addText(f.d, {
      x: x + 0.15,
      y: 4.1,
      w: 2.65,
      h: 1.1,
      fontSize: 15,
      color: i === 2 ? "F6E7E2" : muted,
      align: "center",
      fontFace: "Arial",
    });
  });
  footer(s, 5);
}

// 6 Roles
{
  const s = pptx.addSlide();
  bg(s);
  titleBar(s, "Three company jobs", "One company = one job = one stamp = one API key");
  const roles = [
    { t: "Maker", d: "Creates the picture.\nFirst line. Needs approved AI model." },
    { t: "Editor", d: "Changes the picture.\nMust point at an earlier stamp." },
    { t: "Publisher", d: "Posts the picture.\nMust point at an earlier stamp." },
  ];
  roles.forEach((r, i) => {
    const y = 1.8 + i * 1.55;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.6,
      y,
      w: 12.1,
      h: 1.4,
      fill: { color: card },
      line: { color: line, width: 1 },
      rectRadius: 0.12,
    });
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.85,
      y: y + 0.35,
      w: 2.4,
      h: 0.7,
      fill: { color: i === 0 ? seal : i === 1 ? leaf : ink },
      rectRadius: 0.1,
    });
    s.addText(r.t, {
      x: 0.85,
      y: y + 0.45,
      w: 2.4,
      h: 0.5,
      fontSize: 18,
      color: "FFFFFF",
      align: "center",
      bold: true,
      fontFace: "Arial",
    });
    s.addText(r.d, {
      x: 3.6,
      y: y + 0.35,
      w: 8.7,
      h: 0.8,
      fontSize: 18,
      color: ink,
      fontFace: "Arial",
    });
  });
  footer(s, 6);
}

// 7 Car plate analogy
{
  const s = pptx.addSlide();
  bg(s);
  titleBar(s, "Simple analogy", "Like a car number plate + RTO register");
  const rows = [
    ["Car world", "ModelLedger"],
    ["Number plate on the car", "Hidden id inside the PNG"],
    ["RTO public register", "BNB notebook line"],
    ["Registered plate issuer", "Allowed company stamp"],
    ["VIN / engine check", "File fingerprints"],
  ];
  rows.forEach((row, i) => {
    const y = 1.7 + i * 0.85;
    const header = i === 0;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.6,
      y,
      w: 5.9,
      h: 0.75,
      fill: { color: header ? ink : card },
      line: { color: line, width: 1 },
      rectRadius: 0.08,
    });
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 6.8,
      y,
      w: 5.9,
      h: 0.75,
      fill: { color: header ? seal : card },
      line: { color: line, width: 1 },
      rectRadius: 0.08,
    });
    s.addText(row[0], {
      x: 0.85,
      y: y + 0.18,
      w: 5.4,
      h: 0.45,
      fontSize: 16,
      color: header ? "FFFFFF" : ink,
      bold: header,
      fontFace: "Arial",
    });
    s.addText(row[1], {
      x: 7.05,
      y: y + 0.18,
      w: 5.4,
      h: 0.45,
      fontSize: 16,
      color: header ? "FFFFFF" : ink,
      bold: header,
      fontFace: "Arial",
    });
  });
  footer(s, 7);
}

// 8 Screenshot home
{
  const s = pptx.addSlide();
  bg(s);
  titleBar(s, "Product · Home", "Clear path: Register → Stamp → Check");
  s.addImage({
    path: join(assets, "01-home.png"),
    x: 1.8,
    y: 1.55,
    w: 9.7,
    h: 5.2,
  });
  footer(s, 8);
}

// 9 Screenshot companies
{
  const s = pptx.addSlide();
  bg(s);
  titleBar(s, "Product · Companies", "Register job + models · API key comes with the company");
  s.addImage({
    path: join(assets, "03-register.png"),
    x: 2.8,
    y: 1.5,
    w: 7.7,
    h: 5.3,
  });
  footer(s, 9);
}

// 10 Screenshot check + stamp
{
  const s = pptx.addSlide();
  bg(s);
  titleBar(s, "Product · Stamp & Check", "Click demo for companies · public check for everyone");
  s.addImage({
    path: join(assets, "04-stamp.png"),
    x: 0.5,
    y: 1.6,
    w: 6.0,
    h: 5.0,
  });
  s.addImage({
    path: join(assets, "02-check.png"),
    x: 6.8,
    y: 1.6,
    w: 6.0,
    h: 5.0,
  });
  footer(s, 10);
}

// 11 Live demo plan
{
  const s = pptx.addSlide();
  bg(s);
  titleBar(s, "Live demo next", "What we will click (2–3 minutes)");
  const demo = [
    "Open Check — show Trusted / Self-asserted / Unverifiable",
    "Companies — register Maker + model (API key appears once)",
    "Stamp → Create — company + model → download stamped PNG",
    "Check — upload download → Trusted (company, model, time)",
    "Say: in production their eng calls Stamp API with that key",
  ];
  demo.forEach((d, i) => {
    const y = 1.75 + i * 0.9;
    s.addShape(pptx.shapes.OVAL, {
      x: 0.7,
      y: y + 0.05,
      w: 0.55,
      h: 0.55,
      fill: { color: seal },
    });
    s.addText(String(i + 1), {
      x: 0.7,
      y: y + 0.12,
      w: 0.55,
      h: 0.4,
      fontSize: 16,
      color: "FFFFFF",
      align: "center",
      bold: true,
      fontFace: "Arial",
    });
    s.addText(d, {
      x: 1.5,
      y: y + 0.1,
      w: 11,
      h: 0.5,
      fontSize: 20,
      color: ink,
      fontFace: "Arial",
    });
  });
  footer(s, 11);
}

// 12 Close
{
  const s = pptx.addSlide();
  bg(s);
  s.addText("They generate. We stamp. Anyone checks.", {
    x: 0.8,
    y: 2.2,
    w: 11.7,
    h: 1.0,
    fontSize: 36,
    color: ink,
    align: "center",
    fontFace: "Georgia",
  });
  s.addText(
    "Website = demo remote\nProduct = company Stamp API + public Check\nNotebook on BNB testnet",
    {
      x: 1.5,
      y: 3.5,
      w: 10.3,
      h: 1.6,
      fontSize: 20,
      color: muted,
      align: "center",
      fontFace: "Arial",
      lineSpacing: 32,
    },
  );
  s.addText("Thank you · Questions?", {
    x: 0.8,
    y: 5.6,
    w: 11.7,
    h: 0.6,
    fontSize: 24,
    color: seal,
    align: "center",
    bold: true,
    fontFace: "Arial",
  });
  footer(s, 12);
}

await pptx.writeFile({ fileName: out });
console.log(`Wrote ${out}`);
