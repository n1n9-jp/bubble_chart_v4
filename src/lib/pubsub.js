var Eventer = function() {

    if( !(this instanceof Eventer) ) {
        return new Eventer();
    }
  
    cache = {};
  
    this.publish = function(topic, args){
        if(typeof cache[topic] === 'object') {    
            cache[topic].forEach(function(property){
                property.apply(this, args || []);
            });
        }
    };
  
    this.subscribe = function(topic, callback){
        if(!cache[topic]){
            cache[topic] = [];
        }
        cache[topic].push(callback);
        return [topic, callback]; 
    };
  
    this.unsubscribe = function(topic, fn){
        if( cache[topic] ) {
            cache[topic].forEach(function(element, idx){
                if(element == fn){
                    cache[topic].splice(idx, 1);
                }
            });
        }
    };
  
    this.queue = function() {
        return cache;
    };
  
    // alias
    this.on      = this.subscribe;
    this.off     = this.unsubscribe;
    this.trigger = this.publish;
  
  return this;
  };