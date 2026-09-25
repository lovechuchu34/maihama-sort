let people = [];

let wins = {};
let losses = {};
let draws = {};

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


  wins = {};
  losses = {};
  draws = {};


  people.forEach(person => {

    wins[person.id] = {};
    losses[person.id] = {};
    draws[person.id] = {};

  });


  comparisons = 0;


  /*
    人数が少ない場合は多めに比較。
    人数が多い場合は600回を上限にする。

    重要なのは「回数をこなす」ことではなく、
    比較関係ができるだけ順位全体に広がること。
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
// これまで比較したか確認
// ------------------------------------

function hasCompared(a, b) {

  return (
    wins[a.id][b.id] !== undefined ||
    wins[b.id][a.id] !== undefined ||
    draws[a.id][b.id] !== undefined ||
    draws[b.id][a.id] !== undefined
  );

}


// ------------------------------------
// 比較関係を取得
// ------------------------------------

function getRelationship(a, b) {

  if (wins[a.id][b.id] !== undefined) {
    return "aWins";
  }

  if (wins[b.id][a.id] !== undefined) {
    return "bWins";
  }

  if (draws[a.id][b.id] !== undefined) {
    return "draw";
  }

  return null;

}


// ------------------------------------
// 現在の暫定順位を計算
// ------------------------------------

function calculateRanking() {

  const results = [];


  people.forEach(person => {

    let score = 0;

    let winCount = 0;
    let lossCount = 0;
    let drawCount = 0;


    people.forEach(other => {

      if (person.id === other.id) {
        return;
      }


      if (
        wins[person.id] &&
        wins[person.id][other.id] !== undefined
      ) {

        winCount++;

      }


      if (
        losses[person.id] &&
        losses[person.id][other.id] !== undefined
      ) {

        lossCount++;

      }


      if (
        draws[person.id] &&
        draws[person.id][other.id] !== undefined
      ) {

        drawCount++;

      }

    });


    /*
      勝敗関係そのものを点数化。

      勝ち → +1
      引き分け → 0
      負け → -1

      ただし「誰に勝ったか」も考慮する。
    */

    people.forEach(other => {

      if (person.id === other.id) {
        return;
      }


      if (
        wins[person.id] &&
        wins[person.id][other.id] !== undefined
      ) {

        /*
          相手の強さを考慮。

          強い相手に勝った場合ほど
          少し大きく評価する。
        */

        const opponentWins =
          countWins(other.id);

        const opponentLosses =
          countLosses(other.id);


        const opponentStrength =
          1 +
          (opponentWins - opponentLosses) * 0.1;


        score += opponentStrength;

      }


      if (
        losses[person.id] &&
        losses[person.id][other.id] !== undefined
      ) {

        const opponentWins =
          countWins(other.id);

        const opponentLosses =
          countLosses(other.id);


        const opponentStrength =
          1 +
          (opponentWins - opponentLosses) * 0.1;


        score -= opponentStrength;

      }

    });


    /*
      「どちらも好き」は少しプラス。

      「どちらも嫌い」は少しマイナス。

      ただし勝敗関係ほど強く影響させない。
    */

    score += drawCount * 0.05;


    results.push({

      person,
      score,
      winCount,
      lossCount,
      drawCount

    });

  });


  results.sort((a, b) => {

    if (b.score !== a.score) {
      return b.score - a.score;
    }

    if (b.winCount !== a.winCount) {
      return b.winCount - a.winCount;
    }

    return a.lossCount - b.lossCount;

  });


  return results;

}


// ------------------------------------
// 勝ち数
// ------------------------------------

function countWins(id) {

  if (!wins[id]) {
    return 0;
  }

  return Object.keys(wins[id]).length;

}


// ------------------------------------
// 負け数
// ------------------------------------

function countLosses(id) {

  if (!losses[id]) {
    return 0;
  }

  return Object.keys(losses[id]).length;

}


// ------------------------------------
// 次の比較相手を選ぶ
// ------------------------------------

function choosePair() {

  const ranking =
    calculateRanking();


  /*
    まずまだ比較していない組み合わせを探す。

    順位が近い人同士を優先することで、

    A > B
    B > C

    のような関係を作りやすくする。
  */


  const candidates = [];


  for (let i = 0; i < ranking.length; i++) {

    for (let j = i + 1; j < ranking.length; j++) {

      const a =
        ranking[i].person;

      const b =
        ranking[j].person;


      if (hasCompared(a, b)) {
        continue;
      }


      /*
        暫定順位が近いほど優先
      */

      const distance =
        Math.abs(i - j);


      candidates.push({

        a,
        b,
        distance

      });

    }

  }


  if (candidates.length > 0) {

    /*
      順位差が小さいものを優先。

      同じ順位差ならランダム。
    */

    candidates.sort((a, b) => {

      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }

      return Math.random() - 0.5;

    });


    return [
      candidates[0].a,
      candidates[0].b
    ];

  }


  /*
    全組み合わせを一度比較した場合、
    もう十分なのでランダム比較はしない。
  */

  return null;

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


  /*
    左右が毎回同じ人になり続けないよう、
    ある程度ランダムにする。
  */

  if (Math.random() < 0.5) {

    const temp = leftPerson;

    leftPerson = rightPerson;

    rightPerson = temp;

  }


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


  if (result === "left") {

    wins[leftPerson.id][rightPerson.id] = true;
    losses[rightPerson.id][leftPerson.id] = true;

  }


  else if (result === "right") {

    wins[rightPerson.id][leftPerson.id] = true;
    losses[leftPerson.id][rightPerson.id] = true;

  }


  else if (result === "both") {

    draws[leftPerson.id][rightPerson.id] = true;
    draws[rightPerson.id][leftPerson.id] = true;

  }


  else if (result === "neither") {

    /*
      「どちらも嫌い」は
      勝敗関係にはしない。

      2人とも下位方向に働く情報として記録する。
    */

    losses[leftPerson.id][rightPerson.id] = true;
    losses[rightPerson.id][leftPerson.id] = true;

  }


  comparisons++;

  showNextPair();

}


// ------------------------------------
// 最終結果
// ------------------------------------

function finishSort() {

  sortScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");


  const ranking =
    calculateRanking()
      .slice(0, 9)
      .map(item => item.person);


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
// データ読み込み
// ------------------------------------

loadPeople();
