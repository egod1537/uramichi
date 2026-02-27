import { Polyline } from '@react-google-maps/api'
import { COLOR_PRESETS } from '../../../utils/constants'

function RouteLayer({ routePaths }) {
  return (
    <>
      {routePaths.map((routePath, routeIndex) => (
        <Polyline
          key={`route-${routeIndex}`}
          path={routePath}
          options={{ strokeColor: COLOR_PRESETS.routeGreen, strokeWeight: 4, clickable: false }}
        />
      ))}
    </>
  )
}

export default RouteLayer
