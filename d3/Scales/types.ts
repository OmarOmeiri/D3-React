import type D3ScaleBand from './ScaleBand';
import type D3ScaleColorSequential from './ScaleColorSequential';

import type D3ScaleLinear from './ScaleLinear';
import type D3ScaleLog from './ScaleLog';
import type D3ScaleOrdinal from './ScaleOrdinal';
import type D3ScaleTime from './ScaleTime';

export type D3LinearDomain =
| 'dataMax'
| 'dataMin'
| `dataMax+${number}`
| `dataMin+${number}`
| `dataMax-${number}`
| `dataMin-${number}`
| `dataMax+${number}%`
| `dataMin+${number}%`
| `dataMax-${number}%`
| `dataMin-${number}%`

export type D3TimeDomainOffset =
| 'days'
| 'months'
| 'years'

export type D3TimeDomain =
| 'dataMax'
| 'dataMin'
| `dataMax+${number}${D3TimeDomainOffset}`
| `dataMin+${number}${D3TimeDomainOffset}`
| `dataMax-${number}${D3TimeDomainOffset}`
| `dataMin-${number}${D3TimeDomainOffset}`

export type D3Scales<
D extends Record<string, unknown>,
> =
| D3ScaleBand<D>
| D3ScaleLinear<D>
| D3ScaleLog<D>
| D3ScaleOrdinal<D>
| D3ScaleTime<D>
| D3ScaleColorSequential<D>

export type D3AxedScales<
D extends Record<string, unknown>,
> =
| D3ScaleBand<D>
| D3ScaleLinear<D>
| D3ScaleLog<D>
| D3ScaleTime<D>

export type TD3AxedScales<
D extends Record<string, unknown>,
> =
| D3ScaleBand<D>['scale']
| D3ScaleLinear<D>['scale']
| D3ScaleLog<D>['scale']
| D3ScaleTime<D>['scale']

export interface IScale<
D extends Record<string, unknown>,
> {
  scale: D3Scales<D>
  updateScales: (params: D3Scales<D>) => void
}
