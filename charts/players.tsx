import dayjs from 'dayjs';
import dayjsFormat from 'dayjs/plugin/customParseFormat';
import { shuffle } from 'lodash';
import React, {
  useEffect,
  useState,
} from 'react';
import ReactD3Chart from '../components/d3/Chart/Chart';
import ReactD3Circle from '../components/d3/components/Circle';
import ReactD3ScaleColorSequential from '../components/d3/Scales/ScaleColorSequential';
import ReactD3ScaleLinear from '../components/d3/Scales/ScaleLinear';
import styles from '../styles/Home.module.css';

dayjs.extend(dayjsFormat);

type Player = {
  id: number;
  ego: number;
  skill: number;
  x: number;
  y: number;
}

const rand = (min: number, max: number) => (
  min + Math.round(Math.random() * max)
);

const createPlayer = (id: number): Player => ({
  id,
  ego: rand(10, 20),
  skill: rand(1, 99),
  x: rand(1, 99),
  y: rand(1, 49),
});

export const PlayersChart = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [cut, setCut] = useState<Player[]>([]);

  const updatePlayers = () => {
    if (players.length === 11) {
      setCut(players.splice(rand(1, 5), rand(1, 5)));
    } else {
      cut.forEach((p) => players.push(p));
    }
    const temp = players.map((d) => createPlayer(d.id));
    shuffle(temp);
    setPlayers(temp);
  };

  useEffect(() => {
    const init = [];
    for (let i = 0; i < 11; i++) {
      init.push(createPlayer(i + 1));
    }
    setPlayers(init);
  }, []);

  return (
    <>
      <button onClick={updatePlayers}>Change</button>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <ReactD3Chart>
            <ReactD3ScaleLinear
              id='x-scale'
              data={players}
              dataKey='x'
              domain={['dataMin-10', 'dataMax+10']}
              type='bottom'
            />
            <ReactD3ScaleLinear
              id='y-scale'
              data={players}
              dataKey='y'
              domain={['dataMin-10', 'dataMax+10']}
              type='left'
            />
            <ReactD3ScaleColorSequential
              id='color-scale'
              data={players}
              dataKey='ego'
              domain={['dataMin', 'dataMax']}
              range={['red', 'green']}
            />
            <ReactD3Circle
              data={players}
              xKey='x'
              yKey='y'
              rKey='skill'
              fillOpacity='0.7'
              dataJoinKey={(d) => String(d.id)}
              colorScaleId='color-scale'
              colorKey='ego'
              xAxisId='x-scale'
              yAxisId='y-scale'
            />
          </ReactD3Chart>
        </div>
      </div>
    </>
  );
};
