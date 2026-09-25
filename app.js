let people = [];

let scores = {};
let counts = {};

let leftPerson = null;
let rightPerson = null;

let comparisons = 0;
let maxComparisons = 0;

const startScreen = document.getElementById("start");
const sortScreen = document.getElementById("sort");
const resultScreen = document.getElementById("result");

const startButton = document.getElementById("startButton");

const leftButton = document.getElementById("leftButton");
const rightButton = document.getElementById("rightButton");

const leftImage = document.getElementById("leftImage");
const rightImage = document.getElementById("rightImage");

const leftGroup = document.getElementById("leftGroup");
const rightGroup = document.getElementById("rightGroup");

const bothButton = document.getElementById("bothButton");
const skipButton = document.getElementById("skipButton");

const progressBar = document.getElementById("progressBar");

const resultGrid = document.getElementById("resultGrid");
const againButton = document.getElementById("againButton");


// ------------------------------------
// データ読み込み
// ------------------------------------

async function loadPeople() {

  try {

    const response = await fetch("data.json");

    if (!response.ok) {
      throw new Error("data.jsonを読み込めませんでした");
    }

    people = await response.json();

    console.log("読み込んだ人数:", people.length);

  } catch (error) {

    alert(
      "人物データを読み込めませんでした。\n\n" +
      "data.jsonがGitHubに入っているか確認してください。"
    );

    console.error(error);

  }

}


// ------------------------------------
// ソート開始
// ------------------------------------

function startSort() {

  if (people.length < 2) {

    alert("人物データが2人以上必要です。");

    return;

  }

  scores = {};
  counts = {};

  people.forEach(person => {

    // 全員最初は同じ位置
    scores[person.id] = 0;

    // 何回比較されたか
    counts[person.id] = 0;

  });

  comparisons = 0;

  /*
    人数に応じて比較回数を設定。

    少人数 → しっかり比較
    大人数 → 無限に増えないよう制限
  */

  maxComparisons = Math.min(
    600,
    Math.max(
      100,
      people.length * 5
    )
  );

  startScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  sortScreen.classList.remove("hidden");

  progressBar.style.width = "0%";

  showNextPair();

}


// ------------------------------------
// 次の2人を選ぶ
// ------------------------------------

function choosePair() {

  /*
    比較回数が少ない人を優先する。

    さらに、現在のスコアが近い人同士を
    優先して比較する。
  */

  const shuffled = [...people];

  shuffled.sort(() => Math.random() - 0.5);


  let bestPair = null;
  let bestScore = Infinity;


  /*
    最大25人を候補として調べる
  */

  const sampleSize = Math.min(
    shuffled.length,
    25
  );


  for (let i = 0; i < sampleSize; i++) {

    for (let j = i + 1; j < sampleSize; j++) {

      const a = shuffled[i];
      const b = shuffled[j];


      /*
        同じ2人を何度も比較しすぎないための
        ペナルティ
      */

      const comparisonPenalty =
        (counts[a.id] + counts[b.id]) * 30;


      /*
        スコアが近いほど優先
      */

      const scoreDifference =
        Math.abs(
          scores[a.id] -
          scores[b.id]
        );


      const value =
        scoreDifference +
        comparisonPenalty;


      if (value < bestScore) {

        bestScore = value;

        bestPair = [a, b];

      }

    }

  }


  return bestPair;

}


// ------------------------------------
// 2人を表示
// ------------------------------------

function showNextPair() {

  if (comparisons >= maxComparisons) {

    finishSort();

    return;

  }


  const pair = choosePair();

  if (!pair) {

    finishSort();

    return;

  }


  leftPerson = pair[0];
  rightPerson = pair[1];


  leftImage.src =
    leftPerson.src;

  rightImage.src =
    rightPerson.src;


  leftGroup.textContent =
    leftPerson.group || "";

  rightGroup.textContent =
    rightPerson.group || "";


  const progress =
    (comparisons / maxComparisons) * 100;


  progressBar.style.width =
    progress + "%";

}


// ------------------------------------
// 投票
// ------------------------------------

function vote(result) {

  if (!leftPerson || !rightPerson) {
    return;
  }


  /*
    左右の比較回数を記録
  */

  counts[leftPerson.id]++;
  counts[rightPerson.id]++;


  /*
    スコア変化

    左が好き
      左 +2
      右 -2

    右が好き
      左 -2
      右 +2

    どちらも好き
      両方 +1

    どちらも嫌い
      両方 -1
  */


  if (result === "left") {

    scores[leftPerson.id] += 2;
    scores[rightPerson.id] -= 2;

  }

  else if (result === "right") {

    scores[leftPerson.id] -= 2;
    scores[rightPerson.id] += 2;

  }

  else if (result === "both") {

    scores[leftPerson.id] += 1;
    scores[rightPerson.id] += 1;

  }

  else if (result === "neither") {

    scores[leftPerson.id] -= 1;
    scores[rightPerson.id] -= 1;

  }


  comparisons++;

  showNextPair();

}


// ------------------------------------
// 結果表示
// ------------------------------------

function finishSort() {

  sortScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");


  /*
    スコア順に並べる

    同点の場合は、
    比較回数が多い人を優先
  */

  const ranking =
    [...people]
      .sort((a, b) => {

        const scoreDifference =
          scores[b.id] -
          scores[a.id];

        if (scoreDifference !== 0) {
          return scoreDifference;
        }

        return (
          counts[b.id] -
          counts[a.id]
        );

      })
      .slice(0, 9);


  /*
    Instagram風3×3配置

    4位 5位 6位
    2位 1位 3位
    7位 8位 9位
  */

  const displayOrder = [
    3,
    4,
    5,
    1,
    0,
    2,
    6,
    7,
    8
  ];


  resultGrid.innerHTML = "";


  displayOrder.forEach(index => {

    const person =
      ranking[index];

    if (!person) {
      return;
    }


    const tile =
      document.createElement("div");

    tile.className =
      "resultPerson";


    const image =
      document.createElement("img");

    image.src =
      person.src;

    image.alt = "";


    const rank =
      document.createElement("div");

    rank.className =
      "rank";

    rank.textContent =
      (index + 1) + "位";


    const group =
      document.createElement("div");

    group.className =
      "resultGroup";

    group.textContent =
      person.group || "";


    tile.appendChild(image);
    tile.appendChild(rank);
    tile.appendChild(group);

    resultGrid.appendChild(tile);

  });


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


// ------------------------------------
// ボタン
// ------------------------------------

startButton.addEventListener(
  "click",
  startSort
);


leftButton.addEventListener(
  "click",
  () => vote("left")
);


rightButton.addEventListener(
  "click",
  () => vote("right")
);


bothButton.addEventListener(
  "click",
  () => vote("both")
);


/*
  「スキップ」を
  「どちらも嫌い」に変更
*/

skipButton.textContent =
  "どちらも嫌い";


skipButton.addEventListener(
  "click",
  () => vote("neither")
);


againButton.addEventListener(
  "click",
  startSort
);


// ------------------------------------
// データ読み込み開始
// ------------------------------------

loadPeople();
