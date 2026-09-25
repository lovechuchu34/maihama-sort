let people = [];
let scores = {};

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

    alert("人物データが足りません。");

    return;

  }

  scores = {};

  people.forEach(person => {

    scores[person.id] = 1000;

  });

  comparisons = 0;

  maxComparisons = Math.min(
    500,
    Math.max(
      100,
      people.length * 3
    )
  );

  startScreen.classList.add("hidden");

  resultScreen.classList.add("hidden");

  sortScreen.classList.remove("hidden");

  showNextPair();

}


// ------------------------------------
// 次の2人を選ぶ
// ------------------------------------

function choosePair() {

  const shuffled = [...people];

  shuffled.sort(() => Math.random() - 0.5);

  let bestA = shuffled[0];
  let bestB = shuffled[1];

  let smallestDifference =
    Math.abs(
      scores[bestA.id] -
      scores[bestB.id]
    );

  const sampleSize =
    Math.min(
      shuffled.length,
      25
    );

  for (
    let i = 0;
    i < sampleSize;
    i++
  ) {

    for (
      let j = i + 1;
      j < sampleSize;
      j++
    ) {

      const difference =
        Math.abs(
          scores[shuffled[i].id] -
          scores[shuffled[j].id]
        );

      if (
        difference < smallestDifference
      ) {

        smallestDifference =
          difference;

        bestA = shuffled[i];

        bestB = shuffled[j];

      }

    }

  }

  return [bestA, bestB];

}


// ------------------------------------
// 2人を画面に表示
// ------------------------------------

function showNextPair() {

  if (
    comparisons >=
    maxComparisons
  ) {

    finishSort();

    return;

  }

  const pair = choosePair();

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
    (
      comparisons /
      maxComparisons
    ) * 100;

  progressBar.style.width =
    progress + "%";

}


// ------------------------------------
// Elo計算
// ------------------------------------

function vote(result) {

  const ratingA =
    scores[leftPerson.id];

  const ratingB =
    scores[rightPerson.id];

  const expectedA =
    1 /
    (
      1 +
      Math.pow(
        10,
        (ratingB - ratingA) / 400
      )
    );

  const expectedB =
    1 -
    expectedA;

  let actualA;
  let actualB;

  if (result === "left") {

    actualA = 1;
    actualB = 0;

  }

  else if (result === "right") {

    actualA = 0;
    actualB = 1;

  }

  else {

    actualA = 0.5;
    actualB = 0.5;

  }

  const K = 32;

  scores[leftPerson.id] =
    ratingA +
    K *
    (actualA - expectedA);

  scores[rightPerson.id] =
    ratingB +
    K *
    (actualB - expectedB);

  comparisons++;

  showNextPair();

}


// ------------------------------------
// 結果表示
// ------------------------------------

function finishSort() {

  sortScreen.classList.add("hidden");

  resultScreen.classList.remove("hidden");

  const ranking =
    [...people]
      .sort(
        (a, b) =>
          scores[b.id] -
          scores[a.id]
      )
      .slice(0, 9);


  /*
  
  Instagram風3×3配置

  4位  5位  6位
  2位  1位  3位
  7位  8位  9位

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


skipButton.addEventListener(
  "click",
  () => {

    comparisons++;

    showNextPair();

  }
);


againButton.addEventListener(
  "click",
  startSort
);


// ------------------------------------
// 最初にデータを読み込む
// ------------------------------------

loadPeople();
