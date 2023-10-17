use anyhow::anyhow;
use anyhow::{Context, Result};
use chrono::{DateTime, Duration as ChronoDuration, Utc};
use regex::Regex;
use std::env;

pub fn parse_arguments() -> Result<Vec<String>> {
    let log_domains = ["logs.beemo.gg", "archive.ayu.dev"];

    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        panic!("Please provide a Beemo log link directly when running the command.")
    }

    let url = &args
        .get(1)
        .with_context(|| "Please provide a Beemo log link directly when running the command.")?;

    if !log_domains.iter().any(|&domain| url.contains(domain)) {
        panic!("Invalid log URL. Beemo logs use the logs.beemo.gg or archive.ayu.dev domains.")
    }

    Ok(args)
}

pub fn fetch_log(url: &str) -> Result<String> {
    let text = reqwest::blocking::get(url)
        .with_context(|| format!("Could not read text from URL `{}`", url))?
        .text()
        .with_context(|| format!("Could not read text from URL `{}`", url))?;

    Ok(text)
}

pub fn parse_join_dates(text: &str) -> Result<(Vec<ChronoDuration>, Vec<i64>, usize)> {
    let log_date_re =
        Regex::new(r"\d\d\d\d/\d\d/\d\d(?m)").with_context(|| "Error compiling regex")?;
    let join_date_re = Regex::new(r"\d\d:\d\d:\d\d\.\d\d\d[+,-]\d\d\d\d(?mi)")
        .with_context(|| "Error compiling regex")?;

    let log_date = log_date_re
        .find(&text)
        .map(|m| m.as_str())
        .ok_or_else(|| anyhow!("No log date found in the log."))?;

    let matches: Vec<&str> = join_date_re.find_iter(&text).map(|m| m.as_str()).collect();

    if log_date.is_empty() || matches.is_empty() {
        panic!("No join dates found in log.");
    };

    let mut parsed_join_dates: Vec<DateTime<Utc>> = vec![];
    let mut join_difference: Vec<ChronoDuration> = vec![];
    let mut zero_difference_indexes: Vec<i64> = vec![];

    for (idx, join_date) in matches.iter().enumerate() {
        // Add the date to add a valid DateTime.
        let mut date: DateTime<Utc> = DateTime::parse_from_str(
            &format!("{}T{}", log_date, join_date),
            "%Y/%m/%dT%H:%M:%S%.3f%z",
        )
        .with_context(|| format!("Could not parse date `{}T{}`", log_date, join_date))?
        // Convert to UTC.
        .try_into()
        .with_context(|| format!("Could not parse date `{}T{}`", log_date, join_date))?;

        // We always want the time to be in UTC. Older Beemo logs had a timezone offset; https://stackoverflow.com/a/44710935/12586914.
        if join_date.ends_with("-0700") {
            date = date + ChronoDuration::hours(7);
        }

        parsed_join_dates.push(date);

        if idx == 0 {
            continue;
        }

        let difference = ChronoDuration::milliseconds(
            date.timestamp_millis()
                - parsed_join_dates
                    .get(idx - 1)
                    .unwrap_or(&Utc::now())
                    .timestamp_millis(),
        );

        if difference.num_milliseconds() < 0 {
            continue;
        }

        join_difference.push(difference);

        if difference.num_milliseconds() == 0 {
            zero_difference_indexes.push(
                idx.try_into()
                    .with_context(|| "Unable to convert index to usize")?,
            );
        };
    }

    Ok((join_difference, zero_difference_indexes, matches.len()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_valid_join_dates() {
        let text = "2022/01/01\n00:00:00.000+0000\n00:00:00.000+0000\n00:00:00.000+0000\n";
        let (join_difference, zero_difference_indexes, match_amount) = parse_join_dates(&text).unwrap();
        assert_eq!(join_difference.len(), 2);
        assert_eq!(zero_difference_indexes.len(), 2);
        assert_eq!(match_amount, 3);
    }

    #[test]
    #[should_panic(expected = "No join dates found in log.")]
    fn test_parse_invalid_join_dates() {
        let text = "2022/01/01\n";
        parse_join_dates(&text).unwrap();
    }
}


