import React from 'react'
import { Button, Icon, Label, Segment, Popup } from 'semantic-ui-react'
import timer from '../../utils/timer'

const Finished = (props) => {

  let time = timer(props.time)

  return (
    <Segment clearing>
      <Popup
        trigger={
          <Label basic color="purple" size="big">
            <Icon name="time" /> {time}
          </Label>
        }
        content="This is how long it took you to read your lines."
        on="hover"
        position="bottom left"
        inverted
      />
      <Popup
        trigger={
          <Button onClick={props.startOver} floated="right" style={{ marginLeft: '0.5em' }}>Start Over</Button>}
        content="Click to read your lines again without changing the difficulty level."
        on="hover"
        position="bottom right"
        inverted
      />
      <Popup
        trigger={
          <Button
          icon
          labelPosition="right"
          onClick={props.startHarder}
          floated="right"
          style={{ marginLeft: '0.5em' }}>
          <Icon name="plus" />
          Make Harder
          </Button>
        }
        content="Makes letters disappear from your lines. You can also control the level of difficulty with 'up' and 'down' keys."
        on="hover"
        position="bottom center"
        inverted
      />
      <Popup
        trigger={
          <Button
          icon
          labelPosition="left"
          onClick={props.startEasier}
          floated="right"
          style={{ marginLeft: '0.5em' }}>
          <Icon name="minus" />
          Make Easier
          </Button>
        }
        content="Was it too difficult this time? Click to add back some letters to your lines."
        on="hover"
        position="bottom center"
        inverted
      />
    </Segment>
  )
}

export default Finished
