const {DirectCampaignProvider}=require('./direct-campaign-provider');

function getAdProvider(){return new DirectCampaignProvider()}

module.exports={getAdProvider};