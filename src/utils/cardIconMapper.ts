/**
 * Maps card titles/values to their corresponding icon paths
 * This keeps icons static while card data comes from API
 */
export const getCardIcon = (title: string, value?: string): any => {
  const searchText = (value || title).toLowerCase();

  console.log('searchText-->47', searchText);


  if (searchText.includes('natal chart insights')) {
    return require('../assets/icons/GeneralAnalysis/Personality.png');
  }

  if (searchText.includes('task')) {
    return require('../assets/icons/home/Task.png');
  }
  if (searchText.includes('chart')) {
    return require('../assets/icons/home/Chart.png');
  }
  if (searchText.includes('plans')) {
    return require('../assets/icons/home/Plans.png');
  }
  if (searchText.includes('resources')) {
    return require('../assets/icons/home/Resources.png');
  }
  if (searchText.includes('report')) {
    return require('../assets/icons/home/Report.png');
  }
  if (searchText.includes('settings')) {
    return require('../assets/icons/home/Setting.png');
  }

  // LifeNow icons (CurrentSituation)
  if (searchText.includes('snapshot prediction')) {
    return require('../assets/icons/SnapshotPrediction/SnapshotPrediction.png');
  }
  if (searchText.includes('your personality') || searchText.includes('personality')) {
    return require('../assets/icons/GeneralAnalysis/SnapshotPrediction.png');
  }
  if (searchText.includes('life at the moment')) {
    return require('../assets/icons/chatIcons/Antardasha-refined-analysis-chat.png');
  }
  if (searchText.includes('antardasha') || searchText.includes('active planet')) {
    return require('../assets/icons/chatIcons/Antardasha-chat.png');
  }
  if (searchText.includes('life on the horizon')) {
    return require('../assets/icons/chatIcons/Mahadasha-refined-analysis-chat.png');
  }

  console.log('searchText-->44', searchText);


  // LifeView icons (GeneralAnalysis)
  if (searchText.includes('personality') && !searchText.includes('your')) {
    return require('../assets/icons/GeneralAnalysis/Personality.png');
  }
  if (searchText.includes('family') || searchText.includes('values') || searchText.includes('wealth') || searchText.includes('comfort')) {
    return require('../assets/icons/GeneralAnalysis/FamilyValues.png');
  }
  if (searchText.includes('communication') || searchText.includes('speaking') || searchText.includes('siblings') || searchText.includes('courage') || searchText.includes('skills')) {
    return require('../assets/icons/GeneralAnalysis/Communication.png');
  }
  if (searchText.includes('home') || searchText.includes('happiness') || searchText.includes('emotional foundation')) {
    return require('../assets/icons/GeneralAnalysis/Home.png');
  }
  if (searchText.includes('love') || searchText.includes('romance') || searchText.includes('children') || searchText.includes('celebration') || searchText.includes('hobbies')) {
    return require('../assets/icons/GeneralAnalysis/LoveRomance.png');
  }
  if (searchText.includes('health') || searchText.includes('service') || searchText.includes('routines') || searchText.includes('conflict')) {
    return require('../assets/icons/GeneralAnalysis/HealthService.png');
  }
  if (searchText.includes('marriage') || searchText.includes('partnerships') || searchText.includes('relationships') || searchText.includes('business travel')) {
    return require('../assets/icons/GeneralAnalysis/MarriagePartnerships.png');
  }
  if (searchText.includes('sexuality') || searchText.includes('transformation') || searchText.includes('intimacy') || searchText.includes('inheritance') || searchText.includes('occult') || searchText.includes('unearned income')) {
    return require('../assets/icons/GeneralAnalysis/SexualityTransformation.png');
  }
  if (searchText.includes('higher education') || searchText.includes('philosophy') || searchText.includes('long distance travel')) {
    return require('../assets/icons/GeneralAnalysis/HigherEducation.png');
  }
  if (searchText.includes('career') || searchText.includes('reputation') || searchText.includes('status') || searchText.includes('recognition')) {
    return require('../assets/icons/GeneralAnalysis/CareerReputation.png');
  }
  if (searchText.includes('income') || searchText.includes('innovation') || searchText.includes('network') || searchText.includes('new ideas')) {
    return require('../assets/icons/GeneralAnalysis/IncomeInnovation.png');
  }
  if (searchText.includes('subconscious') || searchText.includes('spirituality') || searchText.includes('hidden enemies') || searchText.includes('losses') || searchText.includes('investment')) {
    return require('../assets/icons/GeneralAnalysis/SubconsciousSpirituality.png');
  }
  if (searchText.includes('general analysis')) {
    return require('../assets/icons/GeneralAnalysis/GeneralAnalysis.png');
  }

  // Default icon if no match found
  return require('../assets/icons/GeneralAnalysis/GeneralAnalysis.png');
};

