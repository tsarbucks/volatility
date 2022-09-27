import { useEffect, useState } from 'react';
import Option from './Option.js';
import PubSub from 'pubsub-js';

const Options = () => {
  useEffect(() => {
    console.log("options - subscribing");
    PubSub.subscribe('options', mySubscriber);
    // mySubscriber is constant, does not need to be in the dependencies
    // subscribe is wrapped in useEffect with an empty dependency list so we only sub once
    // eslint-disable-next-line
  }, []);

  const [list, setList] = useState([]);

  const mySubscriber = (msg, data) => {
    switch (msg) {
      case 'options':
        // if user already inspected this option, just move it to top of the list
        const exists = list.filter(item => item.contractSymbol === data.contractSymbol)
        if (exists.length > 0) {
          console.log("options - dupe " + data.contractSymbol + " len " + list.length);
          setList(list => [...exists, ...list.filter(item => item.contractSymbol !== data.contractSymbol)]);
          break;
        }
        const item = {...data, id: new Date().getTime()}
        setList(list => [item, ...list.filter(it => it.id !== item.id && it.contractSymbol !== item.contractSymbol)]); //list.concat(item)  add failsafe for dupe id
        console.log(`options - got message, len ${list.length}`, data);
        break;
      default:
        console.log("options - ignore message ", data);
        break;
    }
  };
    
  const closeItem = (id) => {
    console.log('close option ', id);
    setList(list => list.filter(item => item.id !== id));
  }
  
  return (
    <ul>
      {list.map(item => (
        <Option
          key={item.id}
          contractSymbol={item.contractSymbol}
          lastPrice={item.lastPrice}
          percentChange={item.percentChange}
          impliedVolatility={item.impliedVolatility}
          bid={item.bid}
          ask={item.ask}
          volume={item.volume}
          openInterest={item.openInterest}
          close={() => closeItem(item.id)}
        />
      ))}
    </ul>
  )
}

export default Options;