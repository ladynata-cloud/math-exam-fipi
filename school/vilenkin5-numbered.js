/* Individual source exercises, Vilenkin et al., part 1, 3rd revised edition, 2023. */
(function (root) {
  'use strict';
  const tables=typeof module!=='undefined'&&module.exports?require('./vilenkin5-numbered-tables.js'):root.Vilenkin5NumberedTables;
  const diary=typeof module!=='undefined'&&module.exports?require('./vilenkin5-weather-diary.js'):root.Vilenkin5WeatherDiary;
  const order=typeof module!=='undefined'&&module.exports?require('./vilenkin5-order-of-operations.js'):root.Vilenkin5OrderOfOperations;
  const shade=typeof module!=='undefined'&&module.exports?require('./vilenkin5-circle-shading.js'):root.Vilenkin5CircleShading;
  const quantities=typeof module!=='undefined'&&module.exports?require('./vilenkin5-fractions-in-quantities.js'):root.Vilenkin5FractionsInQuantities;
  const travel=typeof module!=='undefined'&&module.exports?require('./vilenkin5-route-cloth-concert.js'):root.Vilenkin5RouteClothConcert;
  const ant=typeof module!=='undefined'&&module.exports?require('./vilenkin5-ant-on-a-cube.js'):root.Vilenkin5AntOnACube;
  const octagon=typeof module!=='undefined'&&module.exports?require('./vilenkin5-octagon-parts.js'):root.Vilenkin5OctagonParts;
  const read109=typeof module!=='undefined'&&module.exports?require('./vilenkin5-chains-and-equal-points.js'):root.Vilenkin5ChainsAndEqualPoints;
  const compare=typeof module!=='undefined'&&module.exports?require('./vilenkin5-order-and-compare.js'):root.Vilenkin5OrderAndCompare;
  const sets=typeof module!=='undefined'&&module.exports?require('./vilenkin5-plot-fraction-sets.js'):root.Vilenkin5PlotFractionSets;
  const cellLine=typeof module!=='undefined'&&module.exports?require('./vilenkin5-fraction-cell-line.js'):root.Vilenkin5FractionCellLine;
  const equalArea=typeof module!=='undefined'&&module.exports?require('./vilenkin5-equivalent-area.js'):root.Vilenkin5EquivalentArea;
  const checks26=typeof module!=='undefined'&&module.exports?require('./vilenkin5-check-fraction-parts.js'):root.Vilenkin5CheckFractionParts;
  const triangles=typeof module!=='undefined'&&module.exports?require('./vilenkin5-triangles-and-stock.js'):root.Vilenkin5TrianglesAndStock;
  const island=typeof module!=='undefined'&&module.exports?require('./vilenkin5-island-and-meeting.js'):root.Vilenkin5IslandAndMeeting;
  const classesViews=typeof module!=='undefined'&&module.exports?require('./vilenkin5-classes-and-views.js'):root.Vilenkin5ClassesAndViews;
  const anglesUnits=typeof module!=='undefined'&&module.exports?require('./vilenkin5-chord-and-units.js'):root.Vilenkin5ChordAndUnits;
  const everyday=typeof module!=='undefined'&&module.exports?require('./vilenkin5-wall-bench-groups.js'):root.Vilenkin5WallBenchGroups;
  const loci=typeof module!=='undefined'&&module.exports?require('./vilenkin5-two-circle-constructions.js'):root.Vilenkin5TwoCircleConstructions;
  const durations=typeof module!=='undefined'&&module.exports?require('./vilenkin5-duration-mirror.js'):root.Vilenkin5DurationMirror;
  const radial=typeof module!=='undefined'&&module.exports?require('./vilenkin5-radius-chord-sector.js'):root.Vilenkin5RadiusChordSector;
  const chains=typeof module!=='undefined'&&module.exports?require('./vilenkin5-operation-chains.js'):root.Vilenkin5OperationChains;
  const known=typeof module!=='undefined'&&module.exports?require('./vilenkin5-known-share.js'):root.Vilenkin5KnownShare;
  const portions=typeof module!=='undefined'&&module.exports?require('./vilenkin5-portions.js'):root.Vilenkin5Portions;
  const whole=typeof module!=='undefined'&&module.exports?require('./vilenkin5-part-whole.js'):root.Vilenkin5PartWhole;
  const language=typeof module!=='undefined'&&module.exports?require('./vilenkin5-fraction-language.js'):root.Vilenkin5FractionLanguage;
  const stories=typeof module!=='undefined'&&module.exports?require('./vilenkin5-share-stories.js'):root.Vilenkin5ShareStories;
  const shaded=typeof module!=='undefined'&&module.exports?require('./vilenkin5-shaded-figures.js'):root.Vilenkin5ShadedFigures;
  const readingFraction=typeof module!=='undefined'&&module.exports?require('./vilenkin5-read-fractions.js'):root.Vilenkin5FractionReading;
  const namedParts=typeof module!=='undefined'&&module.exports?require('./vilenkin5-named-parts.js'):root.Vilenkin5NamedParts;
  const equalParts=typeof module!=='undefined'&&module.exports?require('./vilenkin5-equal-parts.js'):root.Vilenkin5EqualParts;
  const circleCheck=typeof module!=='undefined'&&module.exports?require('./vilenkin5-circle-check.js'):root.Vilenkin5CircleCheck;
  const massPowers=typeof module!=='undefined'&&module.exports?require('./vilenkin5-mass-dividend-powers.js'):root.Vilenkin5MassDividendPowers;
  const groupsLayers=typeof module!=='undefined'&&module.exports?require('./vilenkin5-groups-and-layers.js'):root.Vilenkin5GroupsAndLayers;
  const radiusEq=typeof module!=='undefined'&&module.exports?require('./vilenkin5-radius-and-equations.js'):root.Vilenkin5RadiusEquations;
  const points=typeof module!=='undefined'&&module.exports?require('./vilenkin5-three-compass-points.js'):root.Vilenkin5ThreeCompassPoints;
  const disk=typeof module!=='undefined'&&module.exports?require('./vilenkin5-disk-membership.js'):root.Vilenkin5DiskMembership;
  const sundial=typeof module!=='undefined'&&module.exports?require('./vilenkin5-sundial.js'):root.Vilenkin5Sundial;
  const reverseCount=typeof module!=='undefined'&&module.exports?require('./vilenkin5-reverse-count.js'):root.Vilenkin5ReverseCount;
  const boardHoney=typeof module!=='undefined'&&module.exports?require('./vilenkin5-cutting-template.js'):root.Vilenkin5BoardGridAndHoney;
  const sandCubes=typeof module!=='undefined'&&module.exports?require('./vilenkin5-sand-and-cubes.js'):root.Vilenkin5SandAndCubes;
  const squareSums=typeof module!=='undefined'&&module.exports?require('./vilenkin5-square-sums.js'):root.Vilenkin5SquareSums;
  const cubeRows=typeof module!=='undefined'&&module.exports?require('./vilenkin5-cubes-in-a-row.js'):root.Vilenkin5CubesInARow;
  const partsOfUnits=typeof module!=='undefined'&&module.exports?require('./vilenkin5-parts-of-units.js'):root.Vilenkin5PartsOfUnits;
  const printedRay=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-ray.js'):root.Vilenkin5PrintedRay;
  const smallChains=typeof module!=='undefined'&&module.exports?require('./vilenkin5-small-chains.js'):root.Vilenkin5SmallChains;
  const fuel=typeof module!=='undefined'&&module.exports?require('./vilenkin5-fuel-scale.js'):root.Vilenkin5FuelScale;
  const time=typeof module!=='undefined'&&module.exports?require('./vilenkin5-clock-steps.js'):root.Vilenkin5ClockSteps;
  const estimates=typeof module!=='undefined'&&module.exports?require('./vilenkin5-circle-estimates.js'):root.Vilenkin5CircleEstimates;
  const thread=typeof module!=='undefined'&&module.exports?require('./vilenkin5-thread-measurement.js'):root.Vilenkin5ThreadMeasurement;
  const objects=typeof module!=='undefined'&&module.exports?require('./vilenkin5-round-objects.js'):root.Vilenkin5RoundObjects;
  const food=typeof module!=='undefined'&&module.exports?require('./vilenkin5-three-cuts.js'):root.Vilenkin5ThreeCuts;
  const crossings=typeof module!=='undefined'&&module.exports?require('./vilenkin5-circle-crossings.js'):root.Vilenkin5CircleCrossings;
  const chords=typeof module!=='undefined'&&module.exports?require('./vilenkin5-chords.js'):root.Vilenkin5Chords;
  const compass=typeof module!=='undefined'&&module.exports?require('./vilenkin5-compass.js'):root.Vilenkin5Compass;
  const circles=typeof module!=='undefined'&&module.exports?require('./vilenkin5-circle-points.js'):root.Vilenkin5CirclePoints;
  const finalPoint=typeof module!=='undefined'&&module.exports?require('./vilenkin5-first-point-end.js'):root.Vilenkin5FirstPointEnd;
  const digits=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-digits.js'):root.Vilenkin5PrintedDigits;
  const textNumbers=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-text-numbers.js'):root.Vilenkin5PrintedTextNumbers;
  const digitTree=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-digit-tree.js'):root.Vilenkin5PrintedDigitTree;
  const calculations=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-calculations.js'):root.Vilenkin5PrintedCalculations;
  const p15=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-p15.js'):root.Vilenkin5PrintedPageFifteen;
  const segments=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-segments.js'):root.Vilenkin5PrintedSegments;
  const units=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-length-units.js'):root.Vilenkin5PrintedLengthUnits;
  const buildable=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-buildable.js'):root.Vilenkin5PrintedBuildablePaths;
  const boundaries=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-boundaries.js'):root.Vilenkin5PrintedBoundaries;
  const review=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-review.js'):root.Vilenkin5PrintedReview;
  const pageTwenty=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-page20.js'):root.Vilenkin5PrintedPageTwenty;
  const pageTwentyOne=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-page21.js'):root.Vilenkin5PrintedPageTwentyOne;
  const pageLines=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-lines.js'):root.Vilenkin5PrintedLines;
  const lineBuild=typeof module!=='undefined'&&module.exports?require('./vilenkin5-line-build.js'):root.Vilenkin5PointFourBuild;
  const planes=typeof module!=='undefined'&&module.exports?require('./vilenkin5-plane-regions.js'):root.Vilenkin5PlaneRegions;
  const rayObjects=typeof module!=='undefined'&&module.exports?require('./vilenkin5-ray-objects.js'):root.Vilenkin5RayObjects;
  const oral=typeof module!=='undefined'&&module.exports?require('./vilenkin5-oral-subtraction.js'):root.Vilenkin5OralSubtraction;
  const measures=typeof module!=='undefined'&&module.exports?require('./vilenkin5-measure-polygons.js'):root.Vilenkin5LengthPolygon;
  const page25=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-page25.js'):root.Vilenkin5PrintedPage25;
  const constructions25=typeof module!=='undefined'&&module.exports?require('./vilenkin5-constructions25.js'):root.Vilenkin5Constructions25;
  const constructions26=typeof module!=='undefined'&&module.exports?require('./vilenkin5-constructions26.js'):root.Vilenkin5Constructions26;
  const p26Calc=typeof module!=='undefined'&&module.exports?require('./vilenkin5-page26-calculations.js'):root.Vilenkin5Page26Measures;
  const check4=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-check4.js'):root.Vilenkin5PrintedCheck4;
  const sourceScales=typeof module!=='undefined'&&module.exports?require('./vilenkin5-source-scales.js'):root.Vilenkin5SourceScales;
  const sourceMass=typeof module!=='undefined'&&module.exports?require('./vilenkin5-source-mass.js'):root.Vilenkin5SourceMass;
  const axisConstruction=typeof module!=='undefined'&&module.exports?require('./vilenkin5-coordinate-construction.js'):root.Vilenkin5CoordinateConstruction;
  const coordinateDistance=typeof module!=='undefined'&&module.exports?require('./vilenkin5-coordinate-distance.js'):root.Vilenkin5CoordinateDistance;
  const operationRows=typeof module!=='undefined'&&module.exports?require('./vilenkin5-natural-operation-rows.js'):root.Vilenkin5NaturalOperationRows;
  const tripsShares=typeof module!=='undefined'&&module.exports?require('./vilenkin5-trips-shares-chains.js'):root.Vilenkin5TripsSharesChains;
  const copiesDigits=typeof module!=='undefined'&&module.exports?require('./vilenkin5-length-copies-digits.js'):root.Vilenkin5LengthCopiesDigits;
  const segmentCompare=typeof module!=='undefined'&&module.exports?require('./vilenkin5-segments-comparison.js'):root.Vilenkin5SegmentComparison;
  const rankTruth=typeof module!=='undefined'&&module.exports?require('./vilenkin5-ranking-truth.js'):root.Vilenkin5RankingTruth;
  const markedNat=typeof module!=='undefined'&&module.exports?require('./vilenkin5-marked-naturals.js'):root.Vilenkin5MarkedNaturals;
  const chains34=typeof module!=='undefined'&&module.exports?require('./vilenkin5-inequality-chains.js'):root.Vilenkin5InequalityChains;
  const inequalities=typeof module!=='undefined'&&module.exports?require('./vilenkin5-inequality-entry.js'):root.Vilenkin5InequalityEntry;
  const coordinateOrder=typeof module!=='undefined'&&module.exports?require('./vilenkin5-coordinate-order.js'):root.Vilenkin5CoordinateOrder;
  const packsFish=typeof module!=='undefined'&&module.exports?require('./vilenkin5-packs-fish.js'):root.Vilenkin5PacksFish;
  const divisionMass=typeof module!=='undefined'&&module.exports?require('./vilenkin5-divisions-mass.js'):root.Vilenkin5DivisionsMass;
  const loadsRates=typeof module!=='undefined'&&module.exports?require('./vilenkin5-loads-rates.js'):root.Vilenkin5LoadsRates;
  const lineRoles=typeof module!=='undefined'&&module.exports?require('./vilenkin5-lines-places-roles.js'):root.Vilenkin5LinesPlacesRoles;
  const checks=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-checks.js'):root.Vilenkin5PrintedChecks;
  const checksThree=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-checks3.js'):root.Vilenkin5ChecksPointThree;
  const lessons = [
    {number:'1.1', key:'printed-1-1', title:'Читаем таблицу о домашних животных',
      explanation:'Подпись строки показывает, что именно считали. При подсчёте группы складывай численности подходящих животных. Строка о семьях без питомца не прибавляет ни одного животного.',
      worked:['В отдельном опросе записали 4 кошек, 3 черепах и 2 птиц.','У кошек и черепах по четыре ноги. Вместе это 4 + 3 = 7 животных.','Шерсть есть только у кошек. Получилось 4 животных, а не 7.'],
      misconception:'Каждое четвероногое животное покрыто шерстью.', reflect:'Какая строка разделяет группы «четвероногие» и «покрытые шерстью»?'},
    {number:'1.2', key:'printed-1-2', title:'Превращаем список в таблицу частот',
      explanation:'Каждая запись в списке принадлежит одному читателю. Посчитай одинаковые записи. Чтобы получить число книг в группе, умножь число читателей на результат одного из них.',
      worked:['Трое прочитали по 2 книги, двое — по 5.','Читателей 3 + 2 = 5. В первой группе прочитано 3 × 2 = 6 книг, во второй 2 × 5 = 10.','Всего 16 книг. Пять читателей и шестнадцать книг отвечают на разные вопросы.'],
      misconception:'Сумма частот всегда равна числу прочитанных книг.', reflect:'Какая сумма позволяет проверить, что ни одна запись не пропущена?'}
  ].concat(tables.lessons,diary.lesson,finalPoint.lessons,digits.lessons,textNumbers.lessons,digitTree.lessons,calculations.lessons,p15.lessons,checks.lessons,checksThree.lessons,segments.lessons,units.lessons,buildable.lessons,boundaries.lessons,review.lessons,pageTwenty.lessons,[...pageTwentyOne.lessons,buildable.measuredLesson,buildable.pentagonLesson].sort((a,b)=>Number(a.number.split('.')[1])-Number(b.number.split('.')[1])),pageLines.lessons,lineBuild.lessons,planes.lessons,rayObjects.lessons,oral.lessons,measures.lessons,page25.lessons,constructions25.lessons,constructions26.lessons,p26Calc.lessons,check4.lesson,sourceScales.lessons,sourceMass.lessons,axisConstruction.lessons,coordinateDistance.lessons,operationRows.lessons,tripsShares.lessons,copiesDigits.lessons,lineRoles.lessons, loadsRates.lessons,divisionMass.lessons,packsFish.lessons,coordinateOrder.lessons,inequalities.lessons,chains34.lessons,markedNat.lessons,rankTruth.lessons,segmentCompare.lessons,circles.lesson,compass.lessons,chords.lessons,crossings.lessons,food.lesson,objects.lesson,thread.lesson,estimates.lessons,fuel.lesson,time.lesson,smallChains.lessons,printedRay.lesson,partsOfUnits.lessons,cubeRows.lesson,squareSums.lesson,sandCubes.lessons,boardHoney.lessons,reverseCount.lessons,sundial.lesson,disk.lesson,points.lesson,crossings.homework,radiusEq.lessons,groupsLayers.lessons,massPowers.lessons,circleCheck.lessons,equalParts.lessons,namedParts.lessons,readingFraction.lesson,shaded.lesson,...stories.lessons,...language.lessons,...whole.lessons,...portions.lessons,...known.lessons,...chains.lessons,...radial.lessons,...durations.lessons,...loci.lessons,...everyday.lessons,...order.lessons,...shade.lessons,...quantities.lessons,...travel.lessons,...anglesUnits.lessons,...classesViews.lessons,...island.lessons,...triangles.lessons,...checks26.lessons,...equalArea.lessons,...cellLine.lessons,...sets.lessons,...compare.lessons,...read109.lessons,...octagon.lessons,...ant.lessons);
  const pets = ['Кошка','Собака','Хомяк','Черепаха','Морская свинка','Кролик','Птицы','Рыбки','Змеи','Нет животных'];
  const mammal = [0,1,2,4,5], fourLegs = [...mammal,3];
  const sourceCounts = [19,11,3,8,5,1,5,9,0,5];
  const sourceBooks = [4,5,3,4,6,4,3,5,6,4,7,5,6,4,5,5,6,7,5,5,7,4,6,6,3,5,6,4,3,7,5,6];
  const step = (prompt,answer,why,errors=[]) => ({prompt,answer,why,hints:[why],errors,answerFormat:Array.isArray(answer)?'v5-pair':'',v6Full:true});
  const err = (value,text) => ({value,text});
  const total = values => values.reduce((sum,n)=>sum+n,0);
  function animalSurvey(seed,random) {
    const counts = seed === 0 ? sourceCounts.slice() : pets.map(()=>random(1,14));
    if(seed !== 0) {
      counts[random(0,1)] = random(17,26);
      counts[[2,3,7,8][random(0,3)]] = 0;
    }
    const countGroup = indexes=>total(indexes.map(i=>counts[i]));
    const four=countGroup(fourLegs), fur=countGroup(mammal), noLegs=counts[7]+counts[8];
    const absent=counts.indexOf(0), most=counts.indexOf(Math.max(...counts.slice(0,-1)));
    const steps=[
      step('а. Прочитай строку 7, считая заголовок строкой 1. Кто записан и сколько? Введи код (1 — кролик, 2 — птицы), затем количество через точку с запятой.',[1,counts[5]],'Первая строка содержит заголовки. У строки 7 есть название животного и численность.'),
      step('б. Найди вид животных, которого в этом опросе нет. Введи номер его строки.',absent+2,'Отсутствие вида отмечено нулём в строке животного.',[err(11,'Последняя строка сообщает о семьях. Ищи ноль в строке одного из видов животных.')]),
      step('в. Какой питомец встречается чаще всех? Укажи номер строки с этим видом.',most+2,'Сравни правый столбец только у животных. Ответь номером строки, где число наибольшее.',[err(counts[most],'Ты нашёл наибольшую численность. Теперь прочитай номер строки с этим животным.')]),
      step('г. Сколько животных ходят на четырёх ногах?',four,'Отметь кошек, собак, хомяков, черепах, морских свинок и кроликов. Сложи численности этих видов.',[err(fur,'Ты выбрал только животных с шерстью. Проверь ещё строку с черепахами.'),err(four*4,'Получилось число ног. В вопросе считают самих животных.')]),
      step('д. Сколько двуногих животных?',counts[6],'У птицы две ноги. Перенеси численность из строки птиц.',[err(2*counts[6],'Ты посчитал ноги. Каждую птицу здесь считаем один раз.')]),
      step('е. Сколько животных без ног?',noLegs,'Сложи рыбок и змей. Семьи без питомцев сюда не входят.',[err(noLegs+counts[9],'В последней строке посчитали семьи без питомцев. Это не отдельный вид животных.')]),
      step('ж. У скольких животных есть шерсть?',fur,'Убери из четвероногих черепах. Птичьи перья, рыбья чешуя и панцирь не относятся к шерсти.',[err(four,'У черепахи есть четыре ноги и панцирь. Пересмотри строку с черепахами.')])
    ];
    steps[0].clarifications=[err([2,counts[6]],'Если считать только строки с животными, седьмыми действительно стоят птицы. В этом вопросе заголовок считается строкой 1. Прочитай строку с меткой 7.')];
    return {prompt:'з. Сколько всего млекопитающих указано в таблице опроса? В разборе сначала пройди подпункты а–ж.',inputPrompt:'Количество млекопитающих',answer:fur,steps,
      errors:[err(four,'Не все четвероногие здесь млекопитающие. Проверь черепах.'),err(mammal.length,'Это число видов. Сложи численности животных этих видов.')],
      table:{caption:'Результаты опроса о питомцах',headers:['№','Группа','Сколько'],columnWidths:[14,52,34],rows:pets.map((pet,i)=>[i+2,pet,counts[i]])},data:{counts}};
  }
  function readingSurvey(seed,random) {
    const books=seed===0?sourceBooks.slice():[];
    if(seed!==0){
      const last=random(0,1)?8:7;
      for(let n=3;n<=last;n++) for(let i=random(2,8);i>0;i--) books.push(n);
      for(let i=books.length-1;i>0;i--){const j=random(0,i);[books[i],books[j]]=[books[j],books[i]];}
    }
    const values=books.includes(8)?[3,4,5,6,7,8]:[3,4,5,6,7],freq=values.map(n=>books.filter(value=>value===n).length),bookTotal=total(books);
    const steps=values.map((n,i)=>step('Результат одного читателя — '+n+'. Сколько учеников прочитали именно столько и сколько книг получилось в этой группе? Введи два числа через точку с запятой.',[freq[i],n*freq[i]],'Перечитай ряд слева направо и сосчитай вхождения числа '+n+'. Для второго столбца умножь эту частоту на '+n+'.',[
      err([freq[i],freq[i]],'Первый ответ считает учеников. Для второго умножь частоту на '+n+'.'),err([n,freq[i]],'Число '+n+' — это результат одного ученика. Первое поле спрашивает, сколько раз результат встретился.') ]));
    steps.push(step('Итог первого столбца. Сколько учеников приняли участие в опросе?',books.length,'Сложи частоты всех строк и сверь с числом записей в исходном списке.',[err(bookTotal,'Это сумма прочитанных книг. Здесь один элемент списка означает одного ученика.')]));
    steps.push(step('а. Сколько учеников прочитали ровно семь книг?',freq[4],'Нужна частота строки 7, а не сумма книг этой группы.',[err(7*freq[4],'Это книги тех, кто прочитал по семь книг. Перечитай число учеников в её строке.')]));
    steps.push(step('б. Сколько учеников прочитали восемь книг?',freq[5]||0,'Проверь, встречается ли результат 8. Отсутствующему результату соответствует частота ноль.',[err(8,'Восемь — результат, который ищут. Ответ показывает, сколько раз он встретился.')]));
    return {prompt:'в. Сколько книг прочитали все ученики вместе? В разборе заполни частоты и ответь на а и б.',inputPrompt:'Общее число книг',answer:bookTotal,steps,
      errors:[err(books.length,'Ты сложил численности читателей. Для каждой группы умножь частоту на число книг и сложи произведения.'),err(total(values),'Каждый результат учтён один раз. В списке один и тот же результат может принадлежать нескольким ученикам.')],
      table:{caption:'Анкеты читателей. Каждая запись — ответ одного ученика',headers:['Записи','Число прочитанных книг'],rows:Array.from({length:Math.ceil(books.length/8)},(_,i)=>[`${i*8+1}–${Math.min((i+1)*8,books.length)}`,books.slice(i*8,(i+1)*8).join(', ')])},data:{books}};
  }
  function generate(lesson,seed,M){
    const random=M.rng(seed+9153);
    const generators={'1.1':animalSurvey,'1.2':readingSurvey,...tables.generators,'1.8':diary.generate,...finalPoint.generators,...digits.generators,...textNumbers.generators,...digitTree.generators,...calculations.generators,...p15.generators,...segments.generators,...units.generators,...buildable.generators,...boundaries.generators,...review.generators,...pageTwenty.generators,...pageTwentyOne.generators,...pageLines.generators,...lineBuild.generators,...planes.generators,...rayObjects.generators,...oral.generators,...measures.generators,...page25.generators,...constructions25.generators,...constructions26.generators,...p26Calc.generators,'check-4':check4.generate,...sourceScales.generators,...sourceMass.generators,...axisConstruction.generators,...coordinateDistance.generators,...operationRows.generators,...tripsShares.generators,...copiesDigits.generators,...lineRoles.generators, ...loadsRates.generators,...divisionMass.generators,...packsFish.generators,...coordinateOrder.generators,...inequalities.generators,...chains34.generators,...markedNat.generators,...rankTruth.generators,...segmentCompare.generators,...checks.generators,...checksThree.generators,'5.1':circles.generate,...compass.generators,...chords.generators,...crossings.generators,'5.8':food.generate,'5.9':objects.generate,'5.10':thread.generate,...estimates.generators,'5.13':fuel.generate,'5.14':time.generate,...smallChains.generators,'5.17':printedRay.generate,...partsOfUnits.generators,'5.20':cubeRows.generate,'5.21':squareSums.generate,...sandCubes.generators,...boardHoney.generators,...reverseCount.generators,'5.28':sundial.generate,'5.29':disk.generate,'5.30':points.generate,...radiusEq.generators,...groupsLayers.generators,...massPowers.generators,...circleCheck.generators,...equalParts.generators,...namedParts.generators,'5.45':readingFraction.generate,'5.46':shaded.generate,...stories.generators,...language.generators,...whole.generators,...portions.generators,...known.generators,...chains.generators,...radial.generators,...durations.generators,...loci.generators,...everyday.generators,...order.generators,...shade.generators,...quantities.generators,...travel.generators,...anglesUnits.generators,...classesViews.generators,...island.generators,...triangles.generators,...checks26.generators,...equalArea.generators,...cellLine.generators,...sets.generators,...compare.generators,...read109.generators,...octagon.generators,...ant.generators};

    const t=generators[lesson.number](seed,random,step);
    return {...t,conditionKey:t.conditionKey||(t.data.counts||t.data.books).join(','),prompt:(t.prefix||(seed===0&&t.constructionIntro?t.constructionIntro:seed===0?'Данные печатного номера. ':t.data.counts||t.data.books?'Новый авторский опрос. ':'Новое авторское задание. '))+t.prompt,v5Full:true,v6Full:true,model:{kind:'v5-numbered'},data:{...t.data,number:lesson.number}};
  }
  function install(C,M){
    const path=C.pathById.vilenkin5;
    const ids=lessons.map(l=>'v5f-'+l.key);
    lessons.forEach((l,i)=>{
      const lesson={id:ids[i],title:l.sourceCheck?l.title:'№'+l.number+' · '+l.title,number:l.number,grade:5,v5Course:true,fullKey:l.key,point:l.point||1,minutes:15,area:l.sourceCheck?'Проверочные работы учебника':'Номера учебника',requires:l.requires||['v5f-table-read'],related:l.related||['v5f-table-total'],next:lessons[i+1]&&(lessons[i+1].part||1)===(l.part||1)?ids[i+1]:(l.related||['v5f-table-total'])[0],explanation:l.explanation,worked:l.worked,misconception:l.misconception,reflect:[l.reflect],claim:l.misconception,claimTrue:false,source:{book:'Виленкин и соавторы · 5 класс · 2023',part:l.part||1,point:l.point||1,page:l.page||9,...(l.pageEnd?{pageEnd:l.pageEnd}:{})}};
      C.byId[lesson.id]=lesson;C.lessons.push(lesson);
    });
    path.numbered=ids.filter((id,i)=>!lessons[i].sourceCheck);
    path.printedChecks=ids.filter((id,i)=>lessons[i].sourceCheck);
    const accepts=M.accepts;
    const acceptsNumberList=(input,target)=>{
      const list=String(input).split(';').map(x=>digits.natural(x)??x).join(';');
      if(accepts(list,target))return true;
      return Array.isArray(target.printedThermometerAlternative) && accepts(list,{...target,answer:target.printedThermometerAlternative});
    };
    M.accepts=(input,target)=>segmentCompare.custom(target)?segmentCompare.accepts(input,target):rankTruth.custom(target)?rankTruth.accepts(input,target):chains34.custom(target)?chains34.accepts(input,target):target.answerFormat==='v5-written-inequality'?inequalities.accepts(input,target):target.answerFormat==='v5-coordinate-order'?coordinateOrder.read(input)===target.answer:target.answerFormat==='v5-single-coordinate-label'?read109.labelValue(input)===target.answer:target.answerFormat==='v5-coincident-groups'?read109.canonical(input)===read109.canonical(target.answer):target.answerFormat==='v5-ordered-fractions'?M.equal(input,target.answer):target.answerFormat==='v5-fraction-sign'?compare.symbol(input)===target.answer:target.answerFormat==='v5-rightmost-label'?compare.point(input)===target.answer:target.answerFormat==='v5-refined-area'?equalArea.accepts(input,target):target.answerFormat==='v5-difficulty'?checks26.difficult(input):target.answerFormat==='v5-triangle-area-pairs'?triangles.pairs(input)===triangles.pairs(target.answer):target.answerFormat==='v5-stock-expression'?island.vectorKey(triangles.stockExpression(input,island))===island.vectorKey(triangles.stockExpression(target.answer,island)):target.answerFormat==='v5-island-expression'?island.vectorKey(island.coefficients(input))===island.vectorKey(island.coefficients(target.answer)):target.answerFormat==='v5-garage-view'?classesViews.asChoice(input)===target.answer:target.answerFormat==='v5-any-common-radius'?loci.getAnswer(target.locusTest,M.parse(input)):target.answerFormat==='v5-radius-name'?radial.readSegment(input)===radial.readSegment(target.answer):target.answerFormat==='v5-yes-no'?radial.yesNo(input)===target.answer:['v5-spoken-fraction','v5-dictated-fraction'].includes(target.answerFormat)?language.accepts(input,target):target.answerFormat==='v5-fraction-reading'?readingFraction.accepts(input,target.answer):target.answerFormat==='v5-named-unit'?namedParts.textAnswer(input,target.answer):target.answerFormat==='v5-figure124'?check4.diagnosis(input,target)==='':['v5-seven-ray','v5-drawn-angles','v5-positioned-segment'].includes(target.answerFormat)?constructions26.check(input,target)==='':target.answerFormat==='v5-membership-set'?disk.read(input)===target.answer:['v5-subrays','v5-free-line-plot'].includes(target.answerFormat)?constructions25.feedback(input,target.answerFormat)==='':target.answerFormat==='v5-equivalent-length'?measures.mm(input,M)===target.millimetres:target.answerFormat==='v5-polygon-path'?measures.polygonKey(input)===measures.polygonKey(target.answer):target.subtractionColumn||target.zeroWitness?Boolean(oral.accepts(input,target,M)):target.answerFormat==='v5-ray-objects'?rayObjects.analyze(input,target.objectRule).ok:['v5-open-position','v5-ordered-line-names'].includes(target.answerFormat)?lineBuild.accepts(input,target):target.answerFormat==='v5-angle-set'?pageLines.angleNames(input)===pageLines.angleNames(target.answer):['v5-single-length','v5-check-word'].includes(target.answerFormat)?checksThree.accepts(input,target):target.answerFormat==='v5-unit-fraction'?M.equal(partsOfUnits.normalized(input),target.answer):target.answerFormat==='v5-ray-label'?printedRay.read(input)===target.answer:target.answerFormat==='v5-clock-time'?time.readTime(input)===target.answer:target.answerFormat==='v5-object-shape'?objects.read(input)===target.answer:target.answerFormat==='v5-length-pairs'?units.readLengths(input)===units.readLengths(target.answer):['v5-segments','v5-line-points','v5-equal-segments'].includes(target.answerFormat)?segments.accepts(input,target):target.answerFormat==='v5-list'?acceptsNumberList(input,target):target.answerFormat==='v5-classes'?digits.splitClasses(input)===digits.splitClasses(target.answer):target.answerFormat==='v5-natural'?digits.natural(input)===target.answer:target.answerFormat==='v5-reading'?digits.cleanReading(input)===digits.cleanReading(target.answer):target.answerFormat==='v5-arc'?target.arcNames.includes(compass.readArc(input)):target.answerFormat==='v5-point-set'?circles.readSet(input)===target.answer:target.columnRules?Boolean(tables.columnFits(tables.fields(input,M),target.columnRules,target.columnOperation)):accepts(input,target);
    const previous=M.generate;
    M.generate=(id,seed)=>ids.includes(id)?generate(C.byId[id],seed,M):previous(id,seed);
  }
  const escape = value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function table(caption,headers,rows,columnWidths=[]) {
    const columns=columnWidths.length?'<colgroup>'+columnWidths.map(width=>'<col style="width:'+width+'%">').join('')+'</colgroup>':'';
    return '<div class="v5q-table-scroll"><table class="v5q-place-table"><caption>'+escape(caption)+'</caption>'+columns+'<thead><tr>'+headers.map(title=>'<th scope="col"'+(['ч','км/ч','км'].includes(title)?' class="v5q-unit"':'')+'>'+escape(title)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map((value,i)=>i===0?'<th scope="row">'+escape(value)+'</th>':'<td>'+escape(value)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  }
  function taskTable(task,scene) {
    if(task.data.groupedExpression)return order.draw(task,scene);
    if(task.data.antCube)return ant.draw(task,scene);
    if(task.data.octagonRows)return octagon.draw(task,scene);
    if(task.data.coincidentPoints)return read109.draw(task,scene);
    if(task.data.orderedFractions||task.data.compareFractions)return compare.draw(task,scene);
    if(task.data.pointSets)return sets.draw(task,scene);
    if(task.data.fractionLine)return cellLine.draw(task,scene);
    if(task.data.equivalentArea)return equalArea.draw(task,scene);
    if(task.data.fractionSelf||task.data.taskChart)return checks26.draw(task,scene);
    if(task.data.diagonalAreas||task.data.pearStock)return triangles.draw(task,scene);
    if(task.data.islandRoute||task.data.closingGap)return island.draw(task,scene);
    if(task.data.classRows||task.data.garageViews)return classesViews.draw(task,scene);
    if(task.data.chordStudy||task.data.measurePairs)return anglesUnits.draw(task,scene);
    if(task.data.storyStrip)return travel.draw(task,scene);
    if(task.data.quantityParts)return quantities.draw(task,scene);
    if(task.data.shadeDisks)return shade.draw(task,scene);
    if(task.data.wallBenchGroups)return everyday.draw(task,scene);
    if(task.data.circleLoci)return loci.draw(task,scene);
    if(task.data.durationMirror)return durations.draw(task,scene);
    if(task.data.radiusChord)return radial.draw(task,scene);
    if(task.data.chainPractice||task.data.decrease)return chains.draw(task,scene);
    if(task.data.knownShare)return known.draw(task,scene);
    if(task.data.portion)return portions.draw(task,scene);
    if(task.data.partWhole)return whole.draw(task,scene);
    if(task.data.languageRows)return language.draw(task,scene);
    if(task.data.shareStory)return stories.taskDrawing(task,scene);
    if(task.data.shadedAtlas)return shaded.draw(task,scene);
    if(task.data.fractionReadings)return readingFraction.draw(task,scene);
    if(task.data.namedUnits||task.data.quarterPicture)return namedParts.taskDrawing(task,scene);
    if(task.data.equalStrip||task.data.sixthSquare)return equalParts.taskDrawing(task,scene);
    if(task.data.checkDiameter||task.data.checkPositions||task.data.checkCirclePair)return circleCheck.taskDrawing(task,scene);
    if(task.data.tankMass||task.data.dividend||task.data.orderWithPowers)return massPowers.taskDrawing(task,scene);
    if(task.data.fixedQuotient||task.data.layerSolids)return groupsLayers.taskDrawing(task,scene);
    if(task.data.radiusEstimate||task.data.nestedEquations)return radiusEq.taskDrawing(task,scene);
    if(task.data.threeCompass)return points.taskDrawing(task,scene);
    if(task.data.diskMembership)return disk.taskDrawing(task,scene);
    if(task.data.sundial)return sundial.taskDrawing(task,scene);
    if(task.data.reverseStories||task.data.orderRows)return reverseCount.taskDrawing(task,scene);
    if(task.data.boardGrid||task.data.honeyJar)return boardHoney.taskDrawing(task,scene);
    if(task.data.openBox||task.data.cubeScale)return sandCubes.taskDrawing(task,scene);
    if(task.data.squareSums)return squareSums.taskDrawing(task,scene);
    if(task.data.cubeRows)return cubeRows.taskDrawing(task,scene);
    if(task.data.partsOfUnits)return partsOfUnits.taskDrawing(task,scene);
    if(task.data.markedRay)return printedRay.taskDrawing(task,scene);
    if(task.data.smallChains||task.data.groupDecrease)return smallChains.taskDrawing(task,scene);
    if(task.data.fuelScale)return fuel.taskDrawing(task);
    if(task.data.clockMoves)return time.taskDrawing(task);
    if(task.data.estimate)return estimates.taskDrawing(task,scene);
    if(task.data.thread)return thread.taskDrawing(task,table);
    if(task.data.roundObject)return objects.taskDrawing(task,scene);
    if(task.data.foodCuts)return food.taskDrawing(task);
    if(task.data.circleCrossings)return crossings.taskDrawing(task);
    if(task.data.diskDistances||task.data.secantRadii)return chords.taskDrawing(task);
    if(task.data.measurement){const m=task.data.measurement;return compass.compass(m.r,m.origin,2);}
    if(task.data.arcs)return compass.arcs(task.data.arcs);
    if(task.data.circle)return circles.diagram(task.data.circle);
    const {caption,headers,rows,columnWidths}=task.table;
    if(scene.mode==='learn'&&task.data.subtract)return oral.filled(task,scene,table);
    if(scene.mode==='learn'&&task.data.columns){
      const filled=task.data.columns.map((column,i)=>{
        const draft=scene.answers?.[i];
        if(!draft)return rows[i];
        const entries=draft.split(';').map(cell=>cell.trim());
        return [i+1,...(i<4?column.map(value=>value??entries[0]):entries)];
      });
      return table('Твоя таблица. Каждая строка на экране — один столбец учебника.',headers,filled,columnWidths);
    }
    if(scene.mode==='learn'&&task.data.trips){
      const filled=rows.map((row,i)=>row.map(cell=>cell==='—'&&scene.answers?.[i]?scene.answers[i]:cell));
      return table(caption,headers,filled,columnWidths);
    }
    if(scene.mode==='learn'&&task.data.calculations){
      const checked=rows.map((row,i)=>[...row,scene.answers?.[i]||'—']);
      return table(caption,[...headers,'Ответ'],checked,[16,53,31]);
    }
    let output=(task.data.caliperRanking||task.data.insideSegments?segmentCompare.draw(task):task.data.distanceRanking||task.data.truthChecks?rankTruth.draw(task,scene):task.data.naturalLine||task.data.naturalMystery?markedNat.draw(task,scene):task.data.chains34?chains34.draw(task,scene):task.data.comparisonRows?inequalities.draw(task,scene):task.data.coordinateOrder?coordinateOrder.draw(task,scene):task.data.fish?packsFish.silhouettes(task.data.fish):task.data.markSegment?divisionMass.taskDrawing(task,scene):task.data.pencil?lineRoles.sketch(task.data.pencil):coordinateDistance.generators[task.data.number]?coordinateDistance.taskDiagram(task):axisConstruction.generators[task.data.number]?axisConstruction.diagram(task):sourceScales.generators[task.data.number]?sourceScales.diagram(task):task.data.fig124?check4.diagram(task):p26Calc.generators[task.data.number]?p26Calc.diagram(task):constructions26.generators[task.data.number]?constructions26.diagram(task,scene):constructions25.generators[task.data.number]?constructions25.diagram(task,scene):page25.generators[task.data.number]?page25.diagram(task):measures.generators[task.data.number]?measures.diagram(task):rayObjects.generators[task.data.number]?rayObjects.diagram(task):planes.generators[task.data.number]?planes.diagram(task):lineBuild.generators[task.data.number]?lineBuild.diagram(task,scene):pageLines.generators[task.data.number]?pageLines.diagram(task):segments.generators[task.data.number]?segments.drawing(task.data):task.data.kind==='two'?units.distanceDiagram(task.data,0):buildable.generators[task.data.number]?buildable.taskDrawing(task.data):boundaries.generators[task.data.number]?boundaries.graphic(task.data):'')+table(caption,headers,rows,columnWidths);
    if(scene.mode==='learn'&&task.data.books){
      const values=task.data.books.includes(8)?[3,4,5,6,7,8]:[3,4,5,6,7];
      const solved=values.map((n,i)=>{
        const pair=(scene.answers?.[i]||'').split(';');
        return [n,pair[0]||'—',pair[1]||'—'];
      });
      output+=table('Твоя таблица по проверенным ответам',['Книг у одного','Учеников','Всего книг'],solved);
    }
    return output;
  }
  function explore(lesson,state,task) {
    if(task.data.groupedExpression)return order.explore(task,state);
    if(task.data.antCube)return ant.explore(task,state);
    if(task.data.octagonRows)return octagon.explore(task,state);
    if(task.data.coincidentPoints)return read109.explore(task,state);
    if(task.data.orderedFractions||task.data.compareFractions)return compare.explore(task,state);
    if(task.data.pointSets)return sets.explore(task,state);
    if(task.data.fractionLine)return cellLine.explore(task,state);
    if(task.data.equivalentArea)return equalArea.explore(task,state);
    if(task.data.fractionSelf||task.data.taskChart)return checks26.explore(task,state);
    if(task.data.diagonalAreas||task.data.pearStock)return triangles.explore(task,state);
    if(task.data.islandRoute||task.data.closingGap)return island.explore(task,state);
    if(task.data.classRows||task.data.garageViews)return classesViews.explore(task,state);
    if(task.data.chordStudy||task.data.measurePairs)return anglesUnits.explore(task,state);
    if(task.data.storyStrip)return travel.explore(task,state);
    if(task.data.quantityParts)return quantities.explore(task,state);
    if(task.data.shadeDisks)return shade.explore(task,state);
    if(task.data.wallBenchGroups)return everyday.explore(task,state);
    if(task.data.circleLoci)return loci.explore(task,state);
    if(task.data.durationMirror)return durations.explore(task,state);
    if(task.data.radiusChord)return radial.explore(task,state);
    if(task.data.chainPractice||task.data.decrease)return chains.explore(task,state);
    if(task.data.knownShare)return known.explore(task,state);
    if(task.data.portion)return portions.explore(task,state);
    if(task.data.partWhole)return whole.explore(task,state);
    if(task.data.languageRows)return language.explore(task,state);
    if(task.data.shareStory)return stories.explore(task,state);
    if(task.data.shadedAtlas)return shaded.explore(task,state);
    if(task.data.fractionReadings)return readingFraction.explore(task,state);
    if(task.data.namedUnits||task.data.quarterPicture)return namedParts.explore(task,state);
    if(task.data.equalStrip||task.data.sixthSquare)return equalParts.explore(task,state);
    if(task.data.checkDiameter||task.data.checkPositions||task.data.checkCirclePair)return circleCheck.explore(task,state);
    if(task.data.tankMass||task.data.dividend||task.data.orderWithPowers)return massPowers.explore(task,state);
    if(task.data.fixedQuotient||task.data.layerSolids)return groupsLayers.explore(task,state);
    if(task.data.radiusEstimate||task.data.nestedEquations)return radiusEq.explore(task,state);
    if(task.data.threeCompass)return points.explore(task,state);
    if(task.data.diskMembership)return disk.explore(task,state);
    if(task.data.sundial)return sundial.explore(task,state);
    if(task.data.reverseStories||task.data.orderRows)return reverseCount.explore(task,state);
    if(task.data.boardGrid||task.data.honeyJar)return boardHoney.explore(task,state);
    if(task.data.openBox||task.data.cubeScale)return sandCubes.explore(task,state);
    if(task.data.squareSums)return squareSums.explore(task,state);
    if(task.data.cubeRows)return cubeRows.explore(task,state);
    if(task.data.partsOfUnits)return partsOfUnits.explore(task,state);
    if(task.data.markedRay)return printedRay.explore(task,state);
    if(task.data.smallChains||task.data.groupDecrease)return smallChains.explore(task,state);
    if(task.data.fuelScale)return fuel.explore(task,state);
    if(task.data.clockMoves)return time.explore(task,state);
    if(task.data.estimate)return estimates.explore(task,state);
    if(task.data.thread)return thread.explore(task,state,table);
    if(task.data.roundObject)return objects.explore(task,state);
    if(task.data.foodCuts)return food.explore(task,state);
    if(task.data.circleCrossings)return crossings.explore(task,state);
    if(task.data.diskDistances||task.data.secantRadii)return chords.explore(task,state);
    if(task.data.measurement||task.data.arcs)return compass.explore(task,state);
    if(task.data.circle)return circles.explore(task,state);
    if(checksThree.generators[lesson.number])return checksThree.explore(lesson,state,task,table);
    if(checks.generators[lesson.number])return checks.explore(lesson,state,task,table);
    if(segmentCompare.generators[lesson.number])return segmentCompare.explore(lesson,state,task);
    if(rankTruth.generators[lesson.number])return rankTruth.explore(lesson,state,task);
    if(markedNat.generators[lesson.number])return markedNat.explore(lesson,state,task);
    if(chains34.generators[lesson.number])return chains34.explore(lesson,state,task);
    if(inequalities.generators[lesson.number])return inequalities.explore(lesson,state,task);
    if(coordinateOrder.generators[lesson.number])return coordinateOrder.explore(lesson,state,task);
    if(packsFish.generators[lesson.number])return packsFish.explore(lesson,state,task,table);
    if(divisionMass.generators[lesson.number])return divisionMass.explore(lesson,state,task,table);
    if(loadsRates.generators[lesson.number])return loadsRates.explore(lesson,state,task,table);
    if(lineRoles.generators[lesson.number])return lineRoles.explore(lesson,state,task,table);
    if(copiesDigits.generators[lesson.number])return copiesDigits.explore(lesson,state,task,table);
    if(tripsShares.generators[lesson.number])return tripsShares.explore(lesson,state,task,table);
    if(operationRows.generators[lesson.number])return operationRows.explore(lesson,state,task,table);
    if(coordinateDistance.generators[lesson.number])return coordinateDistance.explore(lesson,state,task);
    if(axisConstruction.generators[lesson.number])return axisConstruction.explore(lesson,state,task);
    if(sourceMass.generators[lesson.number])return sourceMass.explore(lesson,state,task,table);
    if(sourceScales.generators[lesson.number])return sourceScales.explore(lesson,state,task,table);
    if(lesson.number==='check-4')return check4.explore(lesson,state,task);
    if(p26Calc.generators[lesson.number])return p26Calc.explore(lesson,state,task,table);
    if(constructions26.generators[lesson.number])return constructions26.explore(lesson,state,task);
    if(constructions25.generators[lesson.number])return constructions25.explore(lesson,state,task);
    if(page25.generators[lesson.number])return page25.explore(lesson,state,task,table);
    if(measures.generators[lesson.number])return measures.explore(lesson,state,task,table);
    if(oral.generators[lesson.number])return oral.explore(lesson,state,task,table);
    if(rayObjects.generators[lesson.number])return rayObjects.explore(lesson,state,task);
    if(planes.generators[lesson.number])return planes.explore(lesson,state,task);
    if(lineBuild.generators[lesson.number])return lineBuild.explore(lesson,state,task);
    if(pageLines.generators[lesson.number])return pageLines.explore(lesson,state,task);
    if(pageTwentyOne.generators[lesson.number])return pageTwentyOne.explore(lesson,state,task,table);
    if(pageTwenty.generators[lesson.number])return pageTwenty.explore(lesson,state,task,table);
    if(review.generators[lesson.number])return review.explore(lesson,state,task,table);
    if(boundaries.generators[lesson.number])return boundaries.explore(lesson,state,task);
    if(buildable.generators[lesson.number])return buildable.explore(lesson,state,task);
    if(units.generators[lesson.number])return units.explore(lesson,state,task,table);
    if(segments.generators[lesson.number])return segments.explore(lesson,state,task);
    if(p15.generators[lesson.number])return p15.explore(lesson,state,task,table);
    if(calculations.generators[lesson.number])return calculations.explore(lesson,state,task,table);
    if(digitTree.generators[lesson.number])return digitTree.explore(lesson,state,task,table);
    if(textNumbers.generators[lesson.number])return textNumbers.explore(lesson,state,task,table);
    if(digits.generators[lesson.number])return digits.explore(lesson,state,task,table);
    if(finalPoint.generators[lesson.number])return finalPoint.explore(lesson,state,task,table);
    if(tables.generators[lesson.number])return tables.explore(lesson,state,task,table);
    if(lesson.number==='1.1'){
      const groups=[['Четыре ноги',fourLegs],['Две ноги',[6]],['Нет ног',[7,8]],['Есть шерсть',mammal]];
      const [group,indexes]=groups[state.group];
      const counts=indexes.map(i=>task.data.counts[i]);
      return {title:'Собери группу по признаку',controls:[{key:'group',title:'Признак животного',values:groups.map(([label],i)=>[i,label])}],visual:table(group,['Животное','Количество'],indexes.map(i=>[pets[i],task.data.counts[i]])),question:'Сколько животных подходит под выбранный признак?',answer:total(counts),why:'Отобранные строки дают '+counts.join(' + ')+' = '+total(counts)+'. Каждое животное посчитано один раз.'};
    }
    const n=state.group+3,rows=task.data.books, matches=rows.filter(v=>v===n).length;
    const result=state.weight?matches*n:matches;
    return {title:'Отметь одинаковые анкеты',controls:[{key:'group',title:'Книг у одного читателя',values:[3,4,5,6,7,8].map((v,i)=>[i,v])},{key:'weight',title:'Что считаем',values:[[0,'Читателей'],[1,'Книги всей группы']]}],visual:'<p>'+rows.map(v=>v===n?'<mark>'+v+'</mark>':String(v)).join(', ')+'</p>',question:state.weight?'Сколько книг прочитали все отмеченные ученики?':'Сколько читателей дали выбранный ответ?',answer:result,why:state.weight?'В группе '+matches+' чел. По '+n+' книг у каждого. Получается '+matches+' × '+n+' = '+result+'.':'Число '+n+' встретилось '+matches+' раз. Каждая отметка — один ученик.'};
  }
  const bounds={'1.1':{group:[0,3,0]},'1.2':{group:[0,5,0],weight:[0,1,0]},...tables.bounds,...finalPoint.bounds,...digits.bounds,...textNumbers.bounds,...digitTree.bounds,...calculations.bounds,...p15.bounds,...segments.bounds,...units.bounds,...buildable.bounds,...boundaries.bounds,...review.bounds,...pageTwenty.bounds,...pageTwentyOne.bounds,...pageLines.bounds,...lineBuild.bounds,...planes.bounds,...rayObjects.bounds,...oral.bounds,...measures.bounds,...page25.bounds,...constructions25.bounds,...constructions26.bounds,...p26Calc.bounds,'check-4':check4.bounds,...sourceScales.bounds,...sourceMass.bounds,...axisConstruction.bounds,...coordinateDistance.bounds,...operationRows.bounds,...tripsShares.bounds,...copiesDigits.bounds,...lineRoles.bounds, ...loadsRates.bounds,...divisionMass.bounds,...packsFish.bounds,...coordinateOrder.bounds,...inequalities.bounds,...chains34.bounds,...markedNat.bounds,...rankTruth.bounds,...segmentCompare.bounds,...checks.bounds,...checksThree.bounds,'5.1':{region:[0,5,0]},...compass.bounds,...chords.bounds,...crossings.bounds,...food.bounds,...objects.bounds,...thread.bounds,...estimates.bounds,...fuel.bounds,...time.bounds,...smallChains.bounds,...printedRay.bounds,...partsOfUnits.bounds,...cubeRows.bounds,...squareSums.bounds,...sandCubes.bounds,...boardHoney.bounds,...reverseCount.bounds,'5.28':sundial.bounds,'5.29':disk.bounds,'5.30':points.bounds,...radiusEq.bounds,...groupsLayers.bounds,...massPowers.bounds,...circleCheck.bounds,...equalParts.bounds,...namedParts.bounds,'5.45':readingFraction.bounds,'5.46':shaded.bounds,...stories.bounds,...language.bounds,...whole.bounds,...portions.bounds,...known.bounds,...chains.bounds,...radial.bounds,...durations.bounds,...loci.bounds,...everyday.bounds,...order.bounds,...shade.bounds,...quantities.bounds,...travel.bounds,...anglesUnits.bounds,...classesViews.bounds,...island.bounds,...triangles.bounds,...checks26.bounds,...equalArea.bounds,...cellLine.bounds,...sets.bounds,...compare.bounds,...read109.bounds,...octagon.bounds,...ant.bounds};
  const api={install,generate,taskTable,explore,bounds,readPointSet:circles.readSet,readArc:compass.readArc,mistake:(input,target,M)=>target.weekRules?finalPoint.mistake(input,target,M):tables.mistake(input,target,M)};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else {root.Vilenkin5Numbered=api;install(root.WorkshopCurriculum,root.WorkshopMath);}
})(typeof window!=='undefined'?window:globalThis);
