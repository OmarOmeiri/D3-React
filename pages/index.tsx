import { BarChart } from '../charts/bar';
import { CoinsChart } from '../charts/coins';
import { GapminderChart } from '../charts/gapminder';
import { GroupedBarChart } from '../charts/groupedBar';
import { PlayersChart } from '../charts/players';
import {
  AreaChart,
  TimeValueChart,
} from '../charts/timeValue';
import { ViolinChart } from '../charts/violin';

export default function Home() {
  return (
    <>
      {/* <PlayersChart/> */}
      {/* <ViolinChart/> */}
      {/* <BarChart/> */}
      <TimeValueChart/>
      {/* <AreaChart/> */}
      {/* <CoinsChart/> */}
      {/* <GapminderChart/> */}
      {/* <GroupedBarChart/> */}
    </>
  );
}
